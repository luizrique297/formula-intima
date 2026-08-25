import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { formatPriceCents, publicImageUrl } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Cart() {
  const { lines, loading, totalCents, updateQuantity, removeItem } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  useDocumentTitle('Carrinho')

  if (loading) return <p className="py-16 text-center text-brand-black/60">Carregando…</p>

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-black/60">Seu carrinho está vazio.</p>
        <Link to="/" className="mt-2 inline-block text-brand-rose hover:underline">
          Ver catálogo
        </Link>
      </div>
    )
  }

  function handleCheckout() {
    if (!user) {
      navigate('/entrar', { state: { from: { pathname: '/checkout' } } })
      return
    }
    navigate('/checkout')
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Seu carrinho</h1>

      <div className="flex flex-col gap-4">
        {lines.map((line) => {
          const price = line.variant.price_cents_override ?? line.product.price_cents
          const label = [line.variant.size, line.variant.color].filter(Boolean).join(' / ')
          return (
            <div key={line.variantId} className="flex items-center gap-4 rounded-xl border border-brand-rose-light bg-white p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-rose-light">
                {line.imagePath && (
                  <img src={publicImageUrl(line.imagePath)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link
                  to={`${line.department === 'sex_shop' ? '/sex-shop' : '/lingerie'}/produto/${line.product.slug}`}
                  className="text-sm font-medium hover:text-brand-rose"
                >
                  {line.product.name}
                </Link>
                {label && <p className="text-xs text-brand-black/50">{label}</p>}
                <p className="mt-1 font-serif text-brand-rose">{formatPriceCents(price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(line.variantId, line.quantity - 1)}
                  className="h-7 w-7 rounded-full border border-brand-rose-light hover:bg-brand-rose-light"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{line.quantity}</span>
                <button
                  onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                  disabled={line.quantity >= line.availableQuantity}
                  className="h-7 w-7 rounded-full border border-brand-rose-light hover:bg-brand-rose-light disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(line.variantId)}
                className="text-xs text-brand-black/40 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-col items-end gap-3 border-t border-brand-rose-light pt-6">
        <p className="font-serif text-xl">
          Total: <span className="text-brand-rose">{formatPriceCents(totalCents)}</span>
        </p>
        <button
          onClick={handleCheckout}
          className="rounded-full bg-brand-rose px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-plum"
        >
          Ir para o checkout
        </button>
      </div>
    </div>
  )
}
