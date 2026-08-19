import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. Veja o arquivo .env.example.',
  )
}

// Sem generic de schema: os tipos das tabelas (em ../types/database) são aplicados
// manualmente em cada função de lib/*.ts, já que não geramos types via Supabase CLI.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
