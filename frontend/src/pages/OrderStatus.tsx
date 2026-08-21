import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchOrderById, ORDER_STATUS_LABEL, type OrderWithItems } from '../lib/orders'
import { formatPriceCents } from '../lib/format'
import { ReturnRequestSection } from '../components/ReturnRequestSection'
import { ReviewSection } from '../components/ReviewSection'

export function OrderStatus() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    let attempts = 0
    async function poll() {
      const data = await fetchOrderById(orderId!)
      setOrder(data)
      setLoading(false)
      // enquanto aguarda confirmação do webhook do Mercado Pago, tenta atualizar por até ~30s
      attempts += 1
      if (data?.status === 'aguardando_pagamento' && attempts < 10) {
        setTimeout(poll, 3000)
      }
    }
    poll()
  }, [orderId])

  if (loading) return <p className="py-16 text-center text-brand-black/60">Carregando…</p>
  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-black/60">Pedido não encontrado.</p>
        <Link to="/" className="mt-2 inline-block text-brand-rose hover:underline">
          Voltar à loja
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="mb-2 font-serif text-2xl text-brand-plum">Pedido recebido</h1>
      <p className="mb-6 text-sm text-brand-black/60">Número do pedido: {order.id}</p>

      <div className="mb-6 inline-block rounded-full bg-brand-rose-light px-4 py-1.5 text-sm font-medium text-brand-plum">
        {ORDER_STATUS_LABEL[order.status] ?? order.status}
      </div>

      {order.status === 'aguardando_pagamento' && (
        <p className="mb-6 text-sm text-brand-black/60">
          Estamos confirmando seu pagamento com o Mercado Pago. Isso pode levar alguns instantes.
        </p>
      )}

      {order.tracking_code && (
        <div className="mb-6 rounded-xl border border-brand-rose-light bg-white p-4 text-left text-sm">
          <p className="font-medium text-brand-plum">Código de rastreio</p>
          <p className="mt-1">{order.tracking_code}</p>
          <a
            href={`https://rastreamento.correios.com.br/app/index.php?objetos=${order.tracking_code}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-brand-rose hover:underline"
          >
            Rastrear no site dos Correios →
          </a>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-brand-rose-light bg-white p-4 text-left">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex justify-between py-1 text-sm">
            <span>
              {item.product_name} {item.variant_label && `(${item.variant_label})`} × {item.quantity}
            </span>
            <span>{formatPriceCents(item.unit_price_cents * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between py-1 text-sm">
          <span>Frete</span>
          <span>{order.shipping_cents === 0 ? 'Grátis' : formatPriceCents(order.shipping_cents)}</span>
        </div>
        {order.discount_cents > 0 && (
          <div className="flex justify-between py-1 text-sm text-brand-rose">
            <span>Desconto {order.coupon_code && `(${order.coupon_code})`}</span>
            <span>-{formatPriceCents(order.discount_cents)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-brand-rose-light pt-2 font-medium">
          <span>Total</span>
          <span className="text-brand-rose">{formatPriceCents(order.total_cents)}</span>
        </div>
      </div>

      <div className="text-left">
        <ReviewSection order={order} />
        <ReturnRequestSection order={order} />
      </div>

      <p className="mt-6">
        <Link to="/minha-conta/pedidos" className="text-sm text-brand-rose hover:underline">
          Ver meus pedidos
        </Link>
      </p>
    </div>
  )
}
