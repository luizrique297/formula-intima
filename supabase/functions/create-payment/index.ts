// Edge Function: create-payment
// Lê o carrinho do usuário autenticado diretamente do banco (nunca confia em preços
// vindos do navegador), cria o pedido, cria uma preferência de pagamento no Mercado
// Pago e devolve a URL de checkout (init_point) para o front-end redirecionar.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!
const SITE_URL = Deno.env.get('SITE_URL')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autenticado.')

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) throw new Error('Sessão inválida.')
    const userId = userData.user.id

    const { address_id } = await req.json()
    if (!address_id) throw new Error('Endereço não informado.')

    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', address_id)
      .eq('user_id', userId)
      .single()
    if (!address) throw new Error('Endereço inválido.')

    // Frete calculado no servidor a partir da UF do endereço — nunca confia no
    // valor que o navegador possa ter mostrado ao cliente.
    const { data: shippingRate } = await supabase
      .from('shipping_rates')
      .select('price_cents')
      .eq('uf', address.state)
      .single()
    const shippingCents = shippingRate?.price_cents ?? 0

    const { data: cartItems } = await supabase.from('cart_items').select('variant_id, quantity').eq('user_id', userId)
    if (!cartItems || cartItems.length === 0) throw new Error('Carrinho vazio.')

    const variantIds = cartItems.map((c) => c.variant_id)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, size, color, price_cents_override, products(id, name, price_cents)')
      .in('id', variantIds)

    const { data: inventoryRows } = await supabase.from('inventory').select('*').in('variant_id', variantIds)
    const inventoryMap = new Map((inventoryRows ?? []).map((i) => [i.variant_id, i.quantity]))

    const orderItems: {
      variant_id: string
      product_name: string
      variant_label: string | null
      unit_price_cents: number
      quantity: number
    }[] = []

    let totalCents = 0
    for (const item of cartItems) {
      const variant = (variants ?? []).find((v: any) => v.id === item.variant_id) as any
      if (!variant) throw new Error('Produto do carrinho não encontrado.')
      const available = inventoryMap.get(item.variant_id) ?? 0
      if (available < item.quantity) throw new Error(`Estoque insuficiente para ${variant.products.name}.`)

      const unitPrice = variant.price_cents_override ?? variant.products.price_cents
      const label = [variant.size, variant.color].filter(Boolean).join(' / ') || null
      orderItems.push({
        variant_id: item.variant_id,
        product_name: variant.products.name,
        variant_label: label,
        unit_price_cents: unitPrice,
        quantity: item.quantity,
      })
      totalCents += unitPrice * item.quantity
    }

    const totalWithShippingCents = totalCents + shippingCents

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        address_id,
        status: 'aguardando_pagamento',
        total_cents: totalWithShippingCents,
        shipping_cents: shippingCents,
      })
      .select()
      .single()
    if (orderError || !order) throw new Error('Não foi possível criar o pedido.')

    const itemsToInsert = orderItems.map((i) => ({ ...i, order_id: order.id }))
    await supabase.from('order_items').insert(itemsToInsert)

    const mpItems = orderItems.map((i) => ({
      title: i.product_name + (i.variant_label ? ` (${i.variant_label})` : ''),
      quantity: i.quantity,
      unit_price: i.unit_price_cents / 100,
      currency_id: 'BRL',
    }))
    if (shippingCents > 0) {
      mpItems.push({ title: 'Frete', quantity: 1, unit_price: shippingCents / 100, currency_id: 'BRL' })
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: mpItems,
        external_reference: order.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        back_urls: {
          success: `${SITE_URL}/#/pedido/${order.id}`,
          pending: `${SITE_URL}/#/pedido/${order.id}`,
          failure: `${SITE_URL}/#/pedido/${order.id}`,
        },
        auto_return: 'approved',
      }),
    })

    if (!mpResponse.ok) {
      const errText = await mpResponse.text()
      throw new Error(`Erro ao criar pagamento no Mercado Pago: ${errText}`)
    }

    const preference = await mpResponse.json()

    await supabase.from('payments').insert({
      order_id: order.id,
      mp_preference_id: preference.id,
      status: 'pending',
      amount_cents: totalWithShippingCents,
    })

    // Esvazia o carrinho agora que virou pedido.
    await supabase.from('cart_items').delete().eq('user_id', userId)

    return new Response(JSON.stringify({ init_point: preference.init_point, order_id: order.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro inesperado.'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
