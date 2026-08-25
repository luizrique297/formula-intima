// Edge Function: notify-restock
// Disparada por um Database Webhook do Supabase em UPDATE na tabela
// `inventory`. Quando a quantidade de uma variante sai de zero (esgotada)
// para positiva (reabastecida), avisa por e-mail todo mundo que pediu pra
// ser notificado nessa variante (tabela `stock_notifications`) e depois
// apaga os pedidos já atendidos.
//
// Arquivo autocontido (sem imports de ../_shared) para colar direto no
// editor de Edge Functions do painel do Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Fórmula Íntima <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('SITE_URL')!
// Só o Database Webhook do Supabase (configurado com este mesmo valor no
// header customizado x-webhook-secret) pode acionar esta function.
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')!

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401, headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const record = payload.record
    const oldRecord = payload.old_record

    const wasOutOfStock = (oldRecord?.quantity ?? 0) <= 0
    const isNowAvailable = (record?.quantity ?? 0) > 0
    if (payload.type !== 'UPDATE' || !wasOutOfStock || !isNowAvailable) {
      return new Response('nothing to notify, skipped', { status: 200, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: requests } = await supabase
      .from('stock_notifications')
      .select('user_id')
      .eq('variant_id', record.variant_id)
    if (!requests || requests.length === 0) {
      return new Response('no one to notify', { status: 200, headers: corsHeaders })
    }

    const { data: variant } = await supabase
      .from('product_variants')
      .select('size, color, products(name, slug, categories(department))')
      .eq('id', record.variant_id)
      .single()

    const productName = (variant as any)?.products?.name ?? 'o produto'
    const variantLabel = [(variant as any)?.size, (variant as any)?.color].filter(Boolean).join(' / ')
    const department = (variant as any)?.products?.categories?.department === 'sex_shop' ? 'sex-shop' : 'lingerie'
    const productSlug = (variant as any)?.products?.slug
    const productUrl = productSlug ? `${SITE_URL}/#/${department}/produto/${productSlug}` : SITE_URL

    for (const { user_id } of requests) {
      const { data: userData } = await supabase.auth.admin.getUserById(user_id)
      const email = userData?.user?.email
      if (!email) continue

      const html = wrapper(
        'O que você esperava chegou! 💗',
        `<p><strong>${productName}</strong>${variantLabel ? ` (${variantLabel})` : ''} está disponível de novo.</p>
         <p style="margin-top:16px;"><a href="${productUrl}" style="color:#9c4a68; font-weight:bold;">Ver produto →</a></p>`,
      )
      await sendEmail(email, `Voltou ao estoque: ${productName}`, html)
    }

    await supabase.from('stock_notifications').delete().eq('variant_id', record.variant_id)

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
