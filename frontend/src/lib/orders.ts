import { supabase } from './supabase'
import type { Order, OrderItem } from '../types/database'

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export async function fetchOrdersForUser(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as OrderWithItems[]
}

export async function fetchOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single()
  if (error) return null
  return data as OrderWithItems
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}
