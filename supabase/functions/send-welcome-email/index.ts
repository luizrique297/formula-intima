// Edge Function: send-welcome-email
// Disparada por um Database Webhook do Supabase em INSERT na tabela
// `profiles` (que por sua vez é criada automaticamente quando alguém se
// cadastra — ver trigger `handle_new_user` na migration 0001).
//
// Arquivo autocontido de propósito (sem imports de ../_shared): assim dá
// para colar direto no editor de Edge Functions do painel do Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Fórmula Íntima <onboarding@resend.dev>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })
  if (!response.ok) console.error(`Falha ao enviar e-mail para ${to}: ${await response.text()}`)
}

function welcomeEmailHtml(fullName: string | null): string {
  const name = fullName?.split(' ')[0] ?? 'Olá'
  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; background: #fdf6f5; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0d8e2;">
      <div style="background: #9c4a68; padding: 24px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px;">Fórmula Íntima</p>
      </div>
      <div style="padding: 24px; color: #2b1620; font-size: 15px; line-height: 1.6;">
        <h1 style="font-size: 18px; color: #9c4a68; margin: 0 0 16px;">${name}, que bom ter você aqui!</h1>
        <p>Sua conta foi criada com sucesso. Agora você já pode navegar pelo catálogo, montar seu carrinho e finalizar sua compra com discrição do início ao fim.</p>
        <p style="color:#8a7078; font-size:13px;">Se você não criou essa conta, pode ignorar este e-mail.</p>
      </div>
      <div style="padding: 16px 24px; background: #faeef2; text-align: center; font-size: 12px; color: #8a7078;">
        Entrega discreta, do jeito que combina com você.
      </div>
    </div>
  </div>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const profile = payload.record

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: userData, error } = await supabase.auth.admin.getUserById(profile.id)
    if (error || !userData.user?.email) throw new Error('Usuário sem e-mail encontrado.')

    await sendEmail(userData.user.email, 'Bem-vinda à Fórmula Íntima 💗', welcomeEmailHtml(profile.full_name))

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    // Sempre 200: um e-mail que falha não deve fazer o Supabase re-tentar
    // o webhook indefinidamente nem bloquear o cadastro do cliente.
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
