import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllProductsAdmin, fetchLowStockVariants, fetchOrdersAdmin, type LowStockVariant } from '../../lib/admin'
import { formatPriceCents } from '../../lib/format'

export function AdminDashboard() {
  const [productCount, setProductCount] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [revenueCents, setRevenueCents] = useState(0)
  const [lowStock, setLowStock] = useState<LowStockVariant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAllProductsAdmin(), fetchOrdersAdmin(), fetchLowStockVariants()]).then(
      ([products, orders, lowStockVariants]) => {
        setProductCount(products.length)
        setPendingOrders(orders.filter((o) => o.status === 'pago' || o.status === 'em_separacao').length)
        setRevenueCents(
          orders.filter((o) => o.status !== 'aguardando_pagamento' && o.status !== 'cancelado').reduce((s, o) => s + o.total_cents, 0),
        )
        setLowStock(lowStockVariants)
        setLoading(false)
      },
    )
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

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium text-amber-800">⚠ Estoque baixo ({lowStock.length})</p>
          <div className="mt-2 flex flex-col gap-1">
            {lowStock.map((v) => (
              <Link
                key={v.variant_id}
                to={`/admin/produtos/${v.product_id}`}
                className="flex justify-between text-sm text-amber-900 hover:underline"
              >
                <span>
                  {v.product_name} {[v.size, v.color].filter(Boolean).join(' / ') && `(${[v.size, v.color].filter(Boolean).join(' / ')})`}
                </span>
                <span className="font-medium">{v.quantity} un.</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
