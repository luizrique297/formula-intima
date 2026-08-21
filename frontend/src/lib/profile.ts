import { supabase } from './supabase'

export async function updateProfile(userId: string, fullName: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName || null, phone: phone || null })
    .eq('id', userId)
  if (error) throw error
}
