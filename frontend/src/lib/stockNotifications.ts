import { supabase } from './supabase'

export async function requestStockNotification(userId: string, variantId: string): Promise<void> {
  const { error } = await supabase
    .from('stock_notifications')
    .upsert({ user_id: userId, variant_id: variantId }, { onConflict: 'user_id,variant_id' })
  if (error) throw error
}

export async function fetchRequestedVariantIds(userId: string, variantIds: string[]): Promise<Set<string>> {
  if (variantIds.length === 0) return new Set()
  const { data } = await supabase
    .from('stock_notifications')
    .select('variant_id')
    .eq('user_id', userId)
    .in('variant_id', variantIds)
  return new Set((data ?? []).map((r) => r.variant_id))
}
