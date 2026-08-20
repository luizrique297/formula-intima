import { supabase } from './supabase'
import type { Category, Product, ProductImage, ProductWithDetails } from '../types/database'

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export interface ProductListItem {
  product: Product
  mainImage: ProductImage | null
}

export async function fetchActiveProducts(opts?: {
  categorySlug?: string
  search?: string
}): Promise<ProductListItem[]> {
  let query = supabase.from('products').select('*, categories(slug)').eq('is_active', true)

  // Filtro por categoria é aplicado depois, em memória (linha ~44): o PostgREST
  // não filtra a linha principal por coluna de uma tabela embutida sem `!inner`,
  // então um `.eq('categories.slug', ...)` aqui seria silenciosamente ignorado.
  if (opts?.search) {
    query = query.ilike('name', `%${opts.search}%`)
  }

  const { data: products, error } = await query.order('created_at', { ascending: false })
  if (error) throw error

  const productIds = (products ?? []).map((p) => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'])
    .order('position', { ascending: true })

  const imageMap = new Map<string, ProductImage>()
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img)
  }

  return (products ?? [])
    .filter((p: any) => !opts?.categorySlug || p.categories?.slug === opts.categorySlug)
    .map((p: any) => ({ product: p, mainImage: imageMap.get(p.id) ?? null }))
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithDetails | null> {
  const { data: product, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !product) return null

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase.from('product_images').select('*').eq('product_id', product.id).order('position'),
    supabase.from('product_variants').select('*').eq('product_id', product.id),
  ])

  const variantIds = (variants ?? []).map((v) => v.id)
  const { data: inventoryRows } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', variantIds.length > 0 ? variantIds : ['00000000-0000-0000-0000-000000000000'])

  const inventoryMap = new Map((inventoryRows ?? []).map((i) => [i.variant_id, i]))

  return {
    ...(product as any),
    category: (product as any).categories ?? null,
    images: images ?? [],
    variants: (variants ?? []).map((v) => ({ ...v, inventory: inventoryMap.get(v.id) ?? null })),
  }
}
