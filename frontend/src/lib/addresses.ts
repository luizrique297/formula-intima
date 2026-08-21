import { supabase } from './supabase'
import type { Address } from '../types/database'

export async function fetchAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export type NewAddress = Omit<Address, 'id' | 'user_id' | 'created_at'>

export async function createAddress(userId: string, address: NewAddress): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .insert({ ...address, user_id: userId })
    .select()
    .single()
  if (error) throw error
  return data as Address
}

export async function updateAddress(id: string, address: NewAddress): Promise<Address> {
  const { data, error } = await supabase.from('addresses').update(address).eq('id', id).select().single()
  if (error) throw error
  return data as Address
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from('addresses').delete().eq('id', id)
  if (error) throw error
}
