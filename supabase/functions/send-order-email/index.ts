// Edge Function: send-order-email
// Disparada por um Database Webhook do Supabase em INSERT e UPDATE na
// tabela `orders`. Em INSERT, manda confirmação de pedido recebido; em
// UPDATE, manda aviso de mudança de status (só quando o status realmente
// mudou — evita e-mail repetido em updates que não mexem no status).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { sendEmail } from '../_shared/resend.ts'
import { orderReceivedEmail, orderStatusEmail } from '../_shared/email-templates.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    if (payload.type === 'INSERT') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, variant_label, quantity, unit_price_cents')
        .eq('order_id', order.id)

      const { subject, html } = orderReceivedEmail(profile?.full_name ?? null, order.id, items ?? [], order.total_cents)
      await sendEmail(email, subject, html)
    } else {
      const { subject, html } = orderStatusEmail(profile?.full_name ?? null, order.id, order.status)
      await sendEmail(email, subject, html)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
