// Edge Function: send-order-email
// Disparada por um Database Webhook do Supabase em INSERT e UPDATE na
// tabela `orders`. Em INSERT, manda confirmação de pedido recebido; em
// UPDATE, manda aviso de mudança de status (só quando o status realmente
// mudou — evita e-mail repetido em updates que não mexem no status).
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

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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

interface OrderItemSummary {
  product_name: string
  variant_label: string | null
  quantity: number
  unit_price_cents: number
}

function itemsTable(items: OrderItemSummary[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0d8e2;">${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} × ${i.quantity}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0d8e2; text-align: right;">${formatCents(i.unit_price_cents * i.quantity)}</td>
      </tr>`,
    )
    .join('')
  return `<table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">${rows}</table>`
}

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_MESSAGE: Record<string, string> = {
  pago: 'Recebemos a confirmação do seu pagamento! Já estamos preparando seu pedido.',
  em_separacao: 'Seu pedido está sendo separado com todo o cuidado.',
  enviado: 'Seu pedido foi enviado e está a caminho, em embalagem discreta.',
  entregue: 'Seu pedido foi entregue. Esperamos que você ame!',
  cancelado: 'Seu pedido foi cancelado. Se não esperava por isso, é só responder este e-mail.',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()
    const order = payload.record
    const oldOrder = payload.old_record

    if (payload.type === 'UPDATE' && oldOrder?.status === order.status) {
      return new Response('status unchanged, skipped', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const [{ data: userData }, { data: profile }] = await Promise.all([
      supabase.auth.admin.getUserById(order.user_id),
      supabase.from('profiles').select('full_name').eq('id', order.user_id).single(),
    ])
    const email = userData?.user?.email
    if (!email) throw new Error('Cliente sem e-mail encontrado.')

    const name = profile?.full_name?.split(' ')[0] ?? 'Olá'

    if (payload.type === 'INSERT') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, variant_label, quantity, unit_price_cents')
        .eq('order_id', order.id)

      const html = wrapper(
        `${name}, seu pedido chegou até nós!`,
        `<p>Assim que o pagamento for confirmado, começamos a separar tudo com carinho.</p>
         ${itemsTable(items ?? [])}
         <p style="text-align:right; font-weight: bold; color: #9c4a68;">Total: ${formatCents(order.total_cents)}</p>
         <p style="color:#8a7078; font-size:13px;">Número do pedido: ${order.id}</p>`,
      )
      await sendEmail(email, 'Recebemos seu pedido 💗', html)
    } else {
      const label = STATUS_LABEL[order.status] ?? order.status
      const message = STATUS_MESSAGE[order.status] ?? 'O status do seu pedido foi atualizado.'
      const html = wrapper(
        `${name}, novidade no seu pedido!`,
        `<p>${message}</p>
         <p style="margin-top:16px; padding: 8px 16px; background: #faeef2; border-radius: 999px; display: inline-block; color: #9c4a68; font-weight: bold;">${label}</p>
         <p style="color:#8a7078; font-size:13px; margin-top:16px;">Número do pedido: ${order.id}</p>`,
      )
      await sendEmail(email, `Seu pedido: ${label}`, html)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
