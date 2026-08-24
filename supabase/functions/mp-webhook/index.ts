// Edge Function: mp-webhook
// Recebe as notificações do Mercado Pago. Sempre confirma o pagamento consultando
// a API do Mercado Pago pelo id recebido (nunca confia em dados enviados direto no
// corpo da notificação), depois marca o pedido como pago e baixa o estoque.
//
// Validação de assinatura (x-signature): confirma que a notificação realmente
// veio do Mercado Pago antes de gastar uma chamada de API com um id que pode
// ter sido inventado por qualquer pessoa que descubra a URL deste endpoint
// (ela é pública, já que o MP precisa conseguir chamá-la sem login). Sem essa
// checagem, um atacante não consegue forjar um pagamento (a lógica abaixo
// sempre reconsulta o status real na API do MP), mas poderia ficar mandando
// ids aleatórios só para gastar as chamadas de API da nossa conta.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
// "Chave secreta" gerada no painel do Mercado Pago (Suas integrações > [sua
// aplicação] > Webhooks). Opcional por enquanto (Deno.env.get sem "!") porque
// a aplicação ainda não tem essa chave configurada — assim que existir, a
// validação abaixo passa a ser aplicada automaticamente, sem precisar mexer
// no código de novo.
const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET') ?? null

// Comparação em tempo constante: evita que um atacante descubra a assinatura
// correta aos poucos, medindo quantos milissegundos a mais uma comparação
// "===" comum leva quando os primeiros caracteres batem (timing attack).
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hasValidSignature(req: Request, paymentId: string): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) return true // chave ainda não configurada: checagem fica desligada até lá

  const signatureHeader = req.headers.get('x-signature')
  const requestId = req.headers.get('x-request-id')
  if (!signatureHeader || !requestId) return false

  const parts: Record<string, string> = {}
  for (const pair of signatureHeader.split(',')) {
    const [key, value] = pair.split('=')
    if (key && value) parts[key.trim()] = value.trim()
  }
  const ts = parts.ts
  const receivedHash = parts.v1
  if (!ts || !receivedHash) return false

  // Formato exigido pelo Mercado Pago: monta a mesma string que eles assinaram
  // do lado deles, para comparar o resultado do HMAC.
  const manifest = `id:${paymentId.toLowerCase()};request-id:${requestId};ts:${ts};`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
  const computedHash = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return timingSafeEqual(computedHash, receivedHash)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const paymentId = url.searchParams.get('data.id') ?? url.searchParams.get('id')
    const topic = url.searchParams.get('type') ?? url.searchParams.get('topic')

    if (!paymentId || topic !== 'payment') {
      return new Response('ignored', { status: 200, headers: corsHeaders })
    }

    if (!(await hasValidSignature(req, paymentId))) {
      console.error('Assinatura do webhook do Mercado Pago inválida — notificação ignorada.')
      return new Response('invalid signature', { status: 200, headers: corsHeaders })
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
