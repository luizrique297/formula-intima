import { supabase } from './supabase'
import type {
  Category,
  Department,
  Inventory,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductImage,
  ProductVariant,
} from '../types/database'

export async function fetchAllProductsAdmin(): Promise<(Product & { categories: Category | null })[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export async function fetchProductForEdit(productId: string) {
  const [{ data: product }, { data: images }, { data: variants }] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).single(),
    supabase.from('product_images').select('*').eq('product_id', productId).order('position'),
    supabase.from('product_variants').select('*').eq('product_id', productId),
  ])
  const variantIds = (variants ?? []).map((v) => v.id)
  const { data: inventoryRows } = await supabase
    .from('inventory')
    .select('*')
    .in('variant_id', variantIds.length > 0 ? variantIds : ['00000000-0000-0000-0000-000000000000'])
  const inventoryMap = new Map((inventoryRows ?? []).map((i) => [i.variant_id, i]))

  return {
    product: product as Product | null,
    images: (images ?? []) as ProductImage[],
    variants: (variants ?? []).map((v) => ({ ...v, inventory: inventoryMap.get(v.id) ?? null })) as (ProductVariant & {
      inventory: Inventory | null
    })[],
  }
}

export type ProductFormInput = Pick<
  Product,
  'name' | 'slug' | 'description' | 'price_cents' | 'category_id' | 'is_active' | 'is_sensitive'
>

export async function createProduct(input: ProductFormInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select().single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(id: string, input: Partial<ProductFormInput>): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function uploadProductImage(
  productId: string,
  file: File,
  position: number,
  color: string | null,
): Promise<ProductImage> {
  const ext = file.name.split('.').pop()
  const path = `${productId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, storage_path: path, position, color })
    .select()
    .single()
  if (error) throw error
  return data as ProductImage
}

export async function deleteProductImage(image: ProductImage): Promise<void> {
  await supabase.storage.from('product-images').remove([image.storage_path])
  await supabase.from('product_images').delete().eq('id', image.id)
}

export type VariantFormInput = Pick<ProductVariant, 'size' | 'color' | 'sku' | 'price_cents_override'>

export async function createVariant(
  productId: string,
  input: VariantFormInput,
  initialQuantity: number,
): Promise<void> {
  const { data: variant, error } = await supabase
    .from('product_variants')
    .insert({ ...input, product_id: productId })
    .select()
    .single()
  if (error) throw error

  await supabase.from('inventory').insert({ variant_id: variant.id, quantity: initialQuantity })
}

export async function updateVariantStock(variantId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .upsert({ variant_id: variantId, quantity, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteVariant(variantId: string): Promise<void> {
  await supabase.from('product_variants').delete().eq('id', variantId)
}

export async function createCategory(name: string, slug: string, department: Department): Promise<Category> {
  const { data, error } = await supabase.from('categories').insert({ name, slug, department }).select().single()
  if (error) throw error
  return data as Category
}

export interface AdminOrder extends Order {
  order_items: OrderItem[]
  profiles: { full_name: string | null } | null
  addresses: { recipient_name: string; street: string; number: string; city: string; state: string } | null
}

export async function fetchOrdersAdmin(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), profiles(full_name), addresses(recipient_name, street, number, city, state)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
