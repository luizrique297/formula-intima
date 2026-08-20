// Edge Function: send-welcome-email
// Disparada por um Database Webhook do Supabase em INSERT na tabela
// `profiles` (que por sua vez é criada automaticamente quando alguém se
// cadastra — ver trigger `handle_new_user` na migration 0001).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { welcomeEmail } from '../_shared/email-templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const profile = payload.record

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: userData, error } = await supabase.auth.admin.getUserById(profile.id)
    if (error || !userData.user?.email) throw new Error('Usuário sem e-mail encontrado.')

    const { subject, html } = welcomeEmail(profile.full_name)
    await sendEmail(userData.user.email, subject, html)

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    // Sempre 200: um e-mail que falha não deve fazer o Supabase re-tentar
    // o webhook indefinidamente nem bloquear o cadastro do cliente.
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
