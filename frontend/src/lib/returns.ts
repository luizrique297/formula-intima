import { supabase } from './supabase'
import type { ReturnRequest } from '../types/database'

export const RETURN_DEADLINE_DAYS = 7

export function isReturnEligible(status: string, deliveredAt: string | null): boolean {
  if (status !== 'entregue' || !deliveredAt) return false
  const deadline = new Date(deliveredAt).getTime() + RETURN_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  return Date.now() <= deadline
}

export async function fetchReturnRequestForOrder(orderId: string): Promise<ReturnRequest | null> {
  const { data } = await supabase.from('return_requests').select('*').eq('order_id', orderId).maybeSingle()
  return data as ReturnRequest | null
}

export async function createReturnRequest(
  orderId: string,
  userId: string,
  reason: string,
  comment: string,
): Promise<void> {
  const { error } = await supabase
    .from('return_requests')
    .insert({ order_id: orderId, user_id: userId, reason, comment: comment || null })
  if (error) throw error
}

export const RETURN_REASON_LABEL: Record<string, string> = {
  nao_gostei: 'Não gostei do produto',
  tamanho_errado: 'Tamanho ou caimento errado',
  defeito: 'Veio com defeito',
  outro: 'Outro motivo',
}

export const RETURN_STATUS_LABEL: Record<string, string> = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  concluido: 'Concluído',
}
