import { supabase } from './supabase'
import type { Category, Department, Product, ProductImage, ProductWithDetails } from '../types/database'

export async function fetchCategories(department?: Department): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('name')
  if (department) query = query.eq('department', department)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export interface ProductListItem {
  product: Product
  mainImage: ProductImage | null
}

export const PRODUCTS_PAGE_SIZE = 24

export interface ProductListResult {
  items: ProductListItem[]
  hasMore: boolean
}

export async function fetchActiveProducts(opts?: {
  department?: Department
  categorySlug?: string
  search?: string
  page?: number
}): Promise<ProductListResult> {
  const page = opts?.page ?? 0
  const from = page * PRODUCTS_PAGE_SIZE
  const to = from + PRODUCTS_PAGE_SIZE - 1

  // `categories!inner(...)` transforma o embed num inner join, permitindo
  // filtrar a busca inteira por coluna da categoria direto no banco — antes
  // isso vinha tudo (de todos os departamentos) e era descartado depois, no
  // navegador, o que buscava dado desnecessário e não permitia paginar direito.
  let query = supabase
    .from('products')
    .select('*, categories!inner(slug, department)', { count: 'exact' })
    .eq('is_active', true)

  if (opts?.department) query = query.eq('categories.department', opts.department)
  if (opts?.categorySlug) query = query.eq('categories.slug', opts.categorySlug)
  if (opts?.search) query = query.ilike('name', `%${opts.search}%`)

  const { data: products, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
  if (error) throw error

  const productIds = (products ?? []).map((p: any) => p.id)
  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'])
    .order('position', { ascending: true })

  const imageMap = new Map<string, ProductImage>()
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img)
  }

  const items = (products ?? []).map((p: any) => ({ product: p, mainImage: imageMap.get(p.id) ?? null }))
  const hasMore = count !== null && to + 1 < count

  return { items, hasMore }
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
