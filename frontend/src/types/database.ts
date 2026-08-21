export type OrderStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'em_separacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'cliente' | 'admin'
  age_confirmed: boolean
  terms_accepted_at: string | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string | null
  recipient_name: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  postal_code: string
  created_at: string
}

export type Department = 'lingerie' | 'sex_shop'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  department: Department
  created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price_cents: number
  is_active: boolean
  is_sensitive: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  position: number
  color: string | null
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string | null
  color: string | null
  sku: string | null
  price_cents_override: number | null
  created_at: string
}

export interface Inventory {
  variant_id: string
  quantity: number
  updated_at: string
}

export interface CartItem {
  id: string
  user_id: string
  variant_id: string
  quantity: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  address_id: string
  status: OrderStatus
  total_cents: number
  shipping_cents: number
  delivered_at: string | null
  tracking_code: string | null
  created_at: string
  updated_at: string
}

export type ReturnStatus = 'solicitado' | 'aprovado' | 'rejeitado' | 'concluido'

export interface ReturnRequest {
  id: string
  order_id: string
  user_id: string
  reason: string
  comment: string | null
  status: ReturnStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string
  product_name: string
  variant_label: string | null
  unit_price_cents: number
  quantity: number
}

export interface Payment {
  id: string
  order_id: string
  mp_payment_id: string | null
  mp_preference_id: string | null
  status: string
  amount_cents: number
  created_at: string
  updated_at: string
}

// Produto "achatado" com imagens, variantes e estoque, como usado nas telas.
export interface ProductWithDetails extends Product {
  category: Category | null
  images: ProductImage[]
  variants: (ProductVariant & { inventory: Inventory | null })[]
}
