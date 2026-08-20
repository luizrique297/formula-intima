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
//
// flowType 'pkce' é obrigatório aqui: o app usa HashRouter (exigido pelo GitHub
// Pages, que não suporta roteamento do lado do servidor) e o fluxo padrão de OAuth
// devolveria o token no fragmento da URL (#access_token=...), que colidiria direto
// com as rotas do HashRouter. Com PKCE o retorno vem como querystring (?code=...),
// antes do #, então router e autenticação não se pisam.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce' },
})
