import { supabase } from './supabase'

export interface CouponValidation {
  valid: boolean
  message?: string
  discount_cents?: number
  code?: string
}

export async function validateCoupon(code: string, totalCents: number): Promise<CouponValidation> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_code: code, p_total_cents: totalCents })
  if (error) return { valid: false, message: 'Erro ao validar cupom.' }
  return data as CouponValidation
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'percentual' | 'fixo'
  discount_value: number
  valid_until: string | null
  max_uses: number | null
  times_used: number
  min_order_cents: number
  active: boolean
  created_at: string
}

export type NewCoupon = Omit<Coupon, 'id' | 'times_used' | 'created_at'>

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createCoupon(coupon: NewCoupon): Promise<Coupon> {
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single()
  if (error) throw error
  return data as Coupon
}

export async function updateCouponActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('coupons').update({ active }).eq('id', id)
  if (error) throw error
}
