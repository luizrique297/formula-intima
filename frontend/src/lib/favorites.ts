import { supabase } from './supabase'
import type { Product, ProductImage } from '../types/database'

export interface FavoriteProduct {
  product: Product & { categories: { department: string } | null }
  mainImage: ProductImage | null
}

export async function fetchFavoriteProducts(userId: string): Promise<FavoriteProduct[]> {
  const { data: favorites } = await supabase.from('favorites').select('product_id').eq('user_id', userId)
  const productIds = (favorites ?? []).map((f) => f.product_id)
  if (productIds.length === 0) return []

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(department)')
    .in('id', productIds)
    .eq('is_active', true)

  const { data: images } = await supabase
    .from('product_images')
    .select('*')
    .in('product_id', productIds)
    .order('position', { ascending: true })

  const imageMap = new Map<string, ProductImage>()
  for (const img of images ?? []) {
    if (!imageMap.has(img.product_id)) imageMap.set(img.product_id, img)
  }

  return (products ?? []).map((p: any) => ({ product: p, mainImage: imageMap.get(p.id) ?? null }))
}
