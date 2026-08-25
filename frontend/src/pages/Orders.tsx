import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchOrdersForUser, ORDER_STATUS_LABEL, type OrderWithItems } from '../lib/orders'
import { formatPriceCents } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  useDocumentTitle('Meus pedidos')

  useEffect(() => {
    if (!user) return
    fetchOrdersForUser(user.id)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <p className="py-16 text-center text-brand-black/60">Carregando…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-brand-black/60">Você ainda não fez nenhum pedido.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/pedido/${order.id}`}
              className="rounded-xl border border-brand-rose-light bg-white p-4 hover:shadow-md"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-black/60">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                <span className="rounded-full bg-brand-rose-light px-3 py-1 text-xs font-medium text-brand-plum">
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-black/70">{order.order_items.length} item(ns)</p>
              <p className="mt-1 font-serif text-brand-rose">{formatPriceCents(order.total_cents)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
