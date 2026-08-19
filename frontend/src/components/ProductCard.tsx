import { Link } from 'react-router-dom'
import { formatPriceCents, publicImageUrl } from '../lib/format'
import type { Product, ProductImage } from '../types/database'

interface Props {
  product: Product
  image?: ProductImage | null
}

export function ProductCard({ product, image }: Props) {
  return (
    <Link
      to={`/produto/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-brand-rose-light bg-white transition hover:shadow-lg"
    >
      <div className="aspect-square overflow-hidden bg-brand-rose-light">
        {image ? (
          <img
            src={publicImageUrl(image.storage_path)}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-plum/40">Sem foto</div>
        )}
      </div>
      <div className="p-3 text-left">
        <p className="truncate text-sm font-medium text-brand-black">{product.name}</p>
        <p className="mt-1 font-serif text-brand-rose">{formatPriceCents(product.price_cents)}</p>
      </div>
    </Link>
  )
}
