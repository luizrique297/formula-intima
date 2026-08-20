import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { ProductVariant, Product } from '../types/database'

export interface CartLine {
  variantId: string
  quantity: number
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price_cents'>
  variant: Pick<ProductVariant, 'id' | 'size' | 'color' | 'price_cents_override'>
  imagePath: string | null
  availableQuantity: number
}

interface CartContextValue {
  lines: CartLine[]
  loading: boolean
  totalItems: number
  totalCents: number
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const LOCAL_KEY = 'formula-intima:cart'

type LocalCart = Record<string, number> // variantId -> quantity

function readLocalCart(): LocalCart {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocalCart(cart: LocalCart) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(cart))
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)

  async function hydrateLines(variantQuantities: LocalCart): Promise<CartLine[]> {
    const variantIds = Object.keys(variantQuantities)
    if (variantIds.length === 0) return []

    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, size, color, price_cents_override, product_id, products(id, name, slug, price_cents)')
      .in('id', variantIds)

    const { data: inventoryRows } = await supabase
      .from('inventory')
      .select('variant_id, quantity')
      .in('variant_id', variantIds)

    const productIds = [...new Set((variants ?? []).map((v: any) => v.product_id))]
    const { data: images } = await supabase
      .from('product_images')
      .select('product_id, storage_path, position')
      .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'])
      .order('position', { ascending: true })

    const inventoryMap = new Map((inventoryRows ?? []).map((r) => [r.variant_id, r.quantity]))
    const imageMap = new Map<string, string>()
    for (const img of images ?? []) {
      if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img.storage_path)
    }

    return (variants ?? []).map((v: any) => ({
      variantId: v.id,
      quantity: variantQuantities[v.id] ?? 0,
      product: v.products,
      variant: { id: v.id, size: v.size, color: v.color, price_cents_override: v.price_cents_override },
      imagePath: imageMap.get(v.product_id) ?? null,
      availableQuantity: inventoryMap.get(v.id) ?? 0,
    }))
  }

  async function loadFromLocal() {
    const local = readLocalCart()
    setLines(await hydrateLines(local))
  }

  async function loadFromServer(userId: string) {
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('variant_id, quantity')
      .eq('user_id', userId)
    const map: LocalCart = {}
    for (const item of cartItems ?? []) map[item.variant_id] = item.quantity
    setLines(await hydrateLines(map))
  }

  async function refresh() {
    setLoading(true)
    if (user) {
      await loadFromServer(user.id)
    } else {
      await loadFromLocal()
    }
    setLoading(false)
  }

  // ao logar, migra itens do carrinho local para o servidor (merge)
  useEffect(() => {
    async function syncOnLogin() {
      if (!user) {
        await refresh()
        return
      }
      const local = readLocalCart()
      const localVariantIds = Object.keys(local)
      if (localVariantIds.length > 0) {
        for (const variantId of localVariantIds) {
          await supabase.from('cart_items').upsert(
            { user_id: user.id, variant_id: variantId, quantity: local[variantId] },
            { onConflict: 'user_id,variant_id' },
          )
        }
        localStorage.removeItem(LOCAL_KEY)
      }
      await refresh()
    }
    syncOnLogin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function addItem(variantId: string, quantity = 1) {
    if (user) {
      const existing = lines.find((l) => l.variantId === variantId)
      const newQty = (existing?.quantity ?? 0) + quantity
      await supabase
        .from('cart_items')
        .upsert({ user_id: user.id, variant_id: variantId, quantity: newQty }, { onConflict: 'user_id,variant_id' })
      await loadFromServer(user.id)
    } else {
      const local = readLocalCart()
      local[variantId] = (local[variantId] ?? 0) + quantity
      writeLocalCart(local)
      await loadFromLocal()
    }
  }

  async function updateQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) return removeItem(variantId)
    if (user) {
      await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('variant_id', variantId)
      await loadFromServer(user.id)
    } else {
      const local = readLocalCart()
      local[variantId] = quantity
      writeLocalCart(local)
      await loadFromLocal()
    }
  }

  async function removeItem(variantId: string) {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id).eq('variant_id', variantId)
      await loadFromServer(user.id)
    } else {
      const local = readLocalCart()
      delete local[variantId]
      writeLocalCart(local)
      await loadFromLocal()
    }
  }

  async function clearCart() {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id)
    } else {
      localStorage.removeItem(LOCAL_KEY)
    }
    setLines([])
  }

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0)
  const totalCents = lines.reduce(
    (sum, l) => sum + l.quantity * (l.variant.price_cents_override ?? l.product.price_cents),
    0,
  )

  return (
    <CartContext.Provider
      value={{ lines, loading, totalItems, totalCents, addItem, updateQuantity, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider')
  return ctx
}
