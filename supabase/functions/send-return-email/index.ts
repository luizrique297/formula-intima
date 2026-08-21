// Edge Function: send-return-email
// Disparada por um Database Webhook do Supabase em INSERT e UPDATE na
// tabela `return_requests`. Em INSERT, confirma o recebimento da
// solicitação; em UPDATE, avisa a cliente sobre a mudança de status
// (aprovado / rejeitado / concluído).
//
// Arquivo autocontido (sem imports de ../_shared) para colar direto no
// editor de Edge Functions do painel do Supabase.
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

function wrapper(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; background: #fdf6f5; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0d8e2;">
      <div style="background: #9c4a68; padding: 24px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px;">Fórmula Íntima</p>
      </div>
      <div style="padding: 24px; color: #2b1620; font-size: 15px; line-height: 1.6;">
        <h1 style="font-size: 18px; color: #9c4a68; margin: 0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; background: #faeef2; text-align: center; font-size: 12px; color: #8a7078;">
        Entrega discreta, do jeito que combina com você.
      </div>
    </div>
  </div>`
}

const STATUS_LABEL: Record<string, string> = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  concluido: 'Concluído',
}

const STATUS_MESSAGE: Record<string, string> = {
  aprovado: 'Sua solicitação de devolução foi aprovada! Em breve entraremos em contato com os próximos passos.',
  rejeitado: 'Sua solicitação de devolução não pôde ser aprovada.',
  concluido: 'Sua devolução foi concluída e o reembolso foi processado.',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const request = payload.record
    const oldRequest = payload.old_record

    if (payload.type === 'UPDATE' && oldRequest?.status === request.status) {
      return new Response('status unchanged, skipped', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: userData } = await supabase.auth.admin.getUserById(request.user_id)
    const email = userData?.user?.email
    if (!email) throw new Error('Cliente sem e-mail encontrado.')

    if (payload.type === 'INSERT') {
      const html = wrapper(
        'Recebemos sua solicitação de devolução',
        `<p>Vamos analisar seu pedido e retornar em breve com uma resposta.</p>
         <p style="color:#8a7078; font-size:13px;">Pedido: ${request.order_id}</p>`,
      )
      await sendEmail(email, 'Solicitação de devolução recebida', html)
    } else {
      const label = STATUS_LABEL[request.status] ?? request.status
      const message = STATUS_MESSAGE[request.status] ?? 'O status da sua solicitação foi atualizado.'
      const notes = request.admin_notes ? `<p style="color:#8a7078; font-size:13px;">Observação: ${request.admin_notes}</p>` : ''
      const html = wrapper(
        'Atualização da sua devolução',
        `<p>${message}</p>
         <p style="margin-top:16px; padding: 8px 16px; background: #faeef2; border-radius: 999px; display: inline-block; color: #9c4a68; font-weight: bold;">${label}</p>
         ${notes}
         <p style="color:#8a7078; font-size:13px; margin-top:16px;">Pedido: ${request.order_id}</p>`,
      )
      await sendEmail(email, `Devolução: ${label}`, html)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
