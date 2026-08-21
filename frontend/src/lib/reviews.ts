import { supabase } from './supabase'

export interface ProductReview {
  id: string
  product_id: string
  order_id: string
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { full_name: string | null } | null
}

export interface RatingSummary {
  average: number
  count: number
}

export async function fetchReviewsForProduct(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, profiles(full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as any
}

export function summarizeRatings(reviews: { rating: number }[]): RatingSummary {
  if (reviews.length === 0) return { average: 0, count: 0 }
  const sum = reviews.reduce((s, r) => s + r.rating, 0)
  return { average: sum / reviews.length, count: reviews.length }
}

export interface ReviewableItem {
  product_id: string
  product_name: string
  already_reviewed: boolean
}

export async function fetchReviewableItems(orderId: string): Promise<ReviewableItem[]> {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, variant_id, product_variants(product_id)')
    .eq('order_id', orderId)

  const { data: reviews } = await supabase.from('product_reviews').select('product_id').eq('order_id', orderId)
  const reviewedIds = new Set((reviews ?? []).map((r) => r.product_id))

  const seen = new Set<string>()
  const result: ReviewableItem[] = []
  for (const item of (items ?? []) as any[]) {
    const productId = item.product_variants?.product_id
    if (!productId || seen.has(productId)) continue
    seen.add(productId)
    result.push({ product_id: productId, product_name: item.product_name, already_reviewed: reviewedIds.has(productId) })
  }
  return result
}

export async function createReview(
  orderId: string,
  productId: string,
  userId: string,
  rating: number,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from('product_reviews')
    .insert({ order_id: orderId, product_id: productId, user_id: userId, rating, comment: comment || null })
  if (error) throw error
}
