// Edge Function: mp-webhook
// Recebe as notificações do Mercado Pago. Sempre confirma o pagamento consultando
// a API do Mercado Pago pelo id recebido (nunca confia em dados enviados direto no
// corpo da notificação), depois marca o pedido como pago e baixa o estoque.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
    const topic = url.searchParams.get('type') ?? url.searchParams.get('topic')

    if (!paymentId || topic !== 'payment') {
      return new Response('ignored', { status: 200, headers: corsHeaders })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    })
    if (!mpResponse.ok) return new Response('payment not found', { status: 200, headers: corsHeaders })

    const payment = await mpResponse.json()
    const orderId = payment.external_reference
    const status = payment.status as string // approved | pending | rejected | ...

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    await supabase
      .from('payments')
      .update({ status, mp_payment_id: String(payment.id), updated_at: new Date().toISOString() })
      .eq('order_id', orderId)

    if (status === 'approved') {
      const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()

      // idempotência: só processa a baixa de estoque uma vez
      if (order && order.status === 'aguardando_pagamento') {
        const { data: items } = await supabase
          .from('order_items')
          .select('variant_id, quantity')
          .eq('order_id', orderId)

        for (const item of items ?? []) {
          await supabase.rpc('decrement_inventory', { p_variant_id: item.variant_id, p_quantity: item.quantity })
        }

        await supabase.from('orders').update({ status: 'pago', updated_at: new Date().toISOString() }).eq('id', orderId)
      }
    } else if (status === 'rejected' || status === 'cancelled') {
      await supabase.from('orders').update({ status: 'cancelado', updated_at: new Date().toISOString() }).eq('id', orderId)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (err) {
    console.error(err)
    // Sempre responde 200 para o Mercado Pago não ficar reenviando indefinidamente
    // um evento que já falhou por um motivo permanente; erros ficam nos logs da function.
    return new Response('error logged', { status: 200, headers: corsHeaders })
  }
})
