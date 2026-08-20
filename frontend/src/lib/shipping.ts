import { supabase } from './supabase'

export interface CepAddress {
  uf: string
  city: string
  neighborhood: string
  street: string
}

// ViaCEP é uma API pública e gratuita mantida por terceiros — só usada para
// descobrir a UF a partir do CEP digitado pelo cliente. O valor do frete em
// si vem da nossa própria tabela `shipping_rates` (configurável no admin).
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!response.ok) return null
  const data = await response.json()
  if (data.erro) return null

  return { uf: data.uf, city: data.localidade, neighborhood: data.bairro, street: data.logradouro }
}

export async function fetchShippingRateByUf(uf: string): Promise<number | null> {
  const { data, error } = await supabase.from('shipping_rates').select('price_cents').eq('uf', uf).single()
  if (error || !data) return null
  return data.price_cents
}

export interface ShippingRate {
  uf: string
  price_cents: number
}

export async function fetchAllShippingRates(): Promise<ShippingRate[]> {
  const { data, error } = await supabase.from('shipping_rates').select('uf, price_cents').order('uf')
  if (error) throw error
  return data ?? []
}

export async function updateShippingRate(uf: string, priceCents: number): Promise<void> {
  const { error } = await supabase
    .from('shipping_rates')
    .update({ price_cents: priceCents, updated_at: new Date().toISOString() })
    .eq('uf', uf)
  if (error) throw error
}
