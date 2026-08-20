import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchProductBySlug } from '../lib/products'
import { formatPriceCents, publicImageUrl } from '../lib/format'
import { useCart } from '../contexts/CartContext'
import { ShippingCalculator } from '../components/ShippingCalculator'
import type { ProductWithDetails } from '../types/database'

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/sex-shop') ? '/sex-shop' : '/lingerie'

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchProductBySlug(slug).then((p) => {
      setProduct(p)
      if (p && p.variants.length > 0) setSelectedVariantId(p.variants[0].id)
      setLoading(false)
    })
  }, [slug])

  if (loading) return <p className="py-16 text-center text-brand-black/60">Carregando…</p>
  if (!product) {
    return (
      <div className="py-16 text-center">
        <p className="text-brand-black/60">Produto não encontrado.</p>
        <Link to={basePath} className="mt-2 inline-block text-brand-rose hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    )
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const price = selectedVariant?.price_cents_override ?? product.price_cents
  const stock = selectedVariant?.inventory?.quantity ?? 0

  // Fotos da cor selecionada; se não houver nenhuma, cai para as fotos
  // genéricas (sem cor definida); se ainda assim não houver, mostra todas.
  const byColor = selectedVariant?.color
    ? product.images.filter((img) => img.color === selectedVariant.color)
    : []
  const generic = product.images.filter((img) => !img.color)
  const visibleImages = byColor.length > 0 ? byColor : generic.length > 0 ? generic : product.images
  const mainImage = visibleImages[mainImageIndex] ?? visibleImages[0]

  function handleSelectVariant(variantId: string) {
    setSelectedVariantId(variantId)
    setMainImageIndex(0)
  }

  async function handleAddToCart() {
    if (!selectedVariantId) return
    setAdding(true)
    await addItem(selectedVariantId, 1)
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function handleBuyNow() {
    if (!selectedVariantId) return
    await addItem(selectedVariantId, 1)
    navigate('/carrinho')
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="grid gap-3">
        <div className="aspect-square overflow-hidden rounded-xl bg-brand-rose-light">
          {mainImage ? (
            <img src={publicImageUrl(mainImage.storage_path)} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-plum/40">Sem foto</div>
          )}
        </div>
        {visibleImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {visibleImages.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setMainImageIndex(i)}
                className={`aspect-square overflow-hidden rounded-lg bg-brand-rose-light ${
                  i === mainImageIndex ? 'ring-2 ring-brand-rose' : ''
                }`}
              >
                <img src={publicImageUrl(img.storage_path)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.category && <p className="mb-1 text-sm text-brand-rose">{product.category.name}</p>}
        <h1 className="font-serif text-2xl text-brand-plum">{product.name}</h1>
        <p className="mt-2 font-serif text-2xl text-brand-black">{formatPriceCents(price)}</p>

        {product.description && <p className="mt-4 whitespace-pre-line text-sm text-brand-black/80">{product.description}</p>}

        {product.variants.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Opções</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const label = [v.size, v.color].filter(Boolean).join(' / ') || 'Único'
                const outOfStock = (v.inventory?.quantity ?? 0) <= 0
                return (
                  <button
                    key={v.id}
                    disabled={outOfStock}
                    onClick={() => handleSelectVariant(v.id)}
                    className={`rounded-full border px-4 py-1.5 text-sm ${
                      v.id === selectedVariantId
                        ? 'border-brand-rose bg-brand-rose text-white'
                        : 'border-brand-rose-light bg-white'
                    } ${outOfStock ? 'cursor-not-allowed opacity-40' : ''}`}
                  >
                    {label} {outOfStock ? '(esgotado)' : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-brand-black/60">
          {stock > 0 ? `${stock} em estoque` : 'Produto indisponível no momento'}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={stock <= 0 || adding}
            className="flex-1 rounded-full border border-brand-rose px-4 py-2.5 text-sm font-medium text-brand-rose hover:bg-brand-rose-light disabled:opacity-50"
          >
            {added ? 'Adicionado!' : 'Adicionar ao carrinho'}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={stock <= 0}
            className="flex-1 rounded-full bg-brand-rose px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-50"
          >
            Comprar agora
          </button>
        </div>

        <p className="mt-4 text-xs text-brand-black/40">Embalagem discreta, sem identificação do conteúdo.</p>

        <div className="mt-6">
          <ShippingCalculator />
        </div>
      </div>
    </div>
  )
}
