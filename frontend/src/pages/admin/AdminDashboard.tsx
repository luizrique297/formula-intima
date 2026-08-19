import { useEffect, useState } from 'react'
import { fetchAllProductsAdmin, fetchOrdersAdmin } from '../../lib/admin'
import { formatPriceCents } from '../../lib/format'

export function AdminDashboard() {
  const [productCount, setProductCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [revenueCents, setRevenueCents] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllProductsAdmin(), fetchOrdersAdmin()]).then(([products, orders]) => {
      setProductCount(products.length)
      setPendingOrders(orders.filter((o) => o.status === 'pago' || o.status === 'em_separacao').length)
      setRevenueCents(orders.filter((o) => o.status !== 'aguardando_pagamento' && o.status !== 'cancelado').reduce((s, o) => s + o.total_cents, 0))
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-brand-black/60">Carregando…</p>

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Painel administrativo</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-brand-rose-light bg-white p-4">
          <p className="text-sm text-brand-black/60">Produtos cadastrados</p>
          <p className="mt-1 font-serif text-2xl text-brand-plum">{productCount}</p>
        </div>
        <div className="rounded-xl border border-brand-rose-light bg-white p-4">
          <p className="text-sm text-brand-black/60">Pedidos para processar</p>
          <p className="mt-1 font-serif text-2xl text-brand-plum">{pendingOrders}</p>
        </div>
        <div className="rounded-xl border border-brand-rose-light bg-white p-4">
          <p className="text-sm text-brand-black/60">Faturamento (pedidos pagos)</p>
          <p className="mt-1 font-serif text-2xl text-brand-plum">{formatPriceCents(revenueCents)}</p>
        </div>
      </div>
    </div>
  )
}
