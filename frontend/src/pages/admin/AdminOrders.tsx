import { useEffect, useState } from 'react'
import { fetchOrdersAdmin, updateOrderStatus, type AdminOrder } from '../../lib/admin'
import { ORDER_STATUS_LABEL } from '../../lib/orders'
import { formatPriceCents } from '../../lib/format'
import type { OrderStatus } from '../../types/database'

const STATUS_OPTIONS: OrderStatus[] = ['aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado']

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrdersAdmin()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    await updateOrderStatus(orderId, status)
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
  }

  if (loading) return <p className="text-brand-black/60">Carregando…</p>

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Pedidos</h1>

      <div className="flex flex-col gap-3">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-brand-rose-light bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{order.profiles?.full_name ?? 'Cliente'}</p>
                <p className="text-xs text-brand-black/50">{new Date(order.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                className="rounded-lg border border-brand-rose-light px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>

            {order.addresses && (
              <p className="mt-2 text-xs text-brand-black/60">
                Entregar em: {order.addresses.street}, {order.addresses.number} — {order.addresses.city}/
                {order.addresses.state}
              </p>
            )}

            <div className="mt-2 border-t border-brand-rose-light pt-2 text-sm">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between py-0.5">
                  <span>
                    {item.product_name} {item.variant_label && `(${item.variant_label})`} × {item.quantity}
                  </span>
                  <span>{formatPriceCents(item.unit_price_cents * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between py-0.5 text-brand-black/60">
                <span>Frete</span>
                <span>{order.shipping_cents === 0 ? 'Grátis' : formatPriceCents(order.shipping_cents)}</span>
              </div>
            </div>
            <p className="mt-2 text-right font-medium text-brand-rose">{formatPriceCents(order.total_cents)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
