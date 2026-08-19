import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllProductsAdmin } from '../../lib/admin'
import { formatPriceCents } from '../../lib/format'
import type { Category, Product } from '../../types/database'

export function AdminProducts() {
  const [products, setProducts] = useState<(Product & { categories: Category | null })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllProductsAdmin()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-brand-plum">Produtos</h1>
        <Link to="/admin/produtos/novo" className="rounded-full bg-brand-rose px-4 py-2 text-sm text-white hover:bg-brand-plum">
          + Novo produto
        </Link>
      </div>

      {loading ? (
        <p className="text-brand-black/60">Carregando…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-brand-rose-light bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-rose-light text-brand-black/60">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-brand-rose-light last:border-0">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.categories?.name ?? '—'}</td>
                  <td className="p-3">{formatPriceCents(p.price_cents)}</td>
                  <td className="p-3">
                    <span className={p.is_active ? 'text-green-700' : 'text-brand-black/40'}>
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link to={`/admin/produtos/${p.id}`} className="text-brand-rose hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
