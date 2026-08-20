import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchActiveProducts, fetchCategories, type ProductListItem } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import type { Category, Department } from '../types/database'

interface Props {
  department: Department
  title: string
}

export function Catalog({ department, title }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoriaSlug = searchParams.get('categoria') ?? ''
  const [search, setSearch] = useState(searchParams.get('busca') ?? '')
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const basePath = department === 'lingerie' ? '/lingerie' : '/sex-shop'

  useEffect(() => {
    fetchCategories(department).then(setCategories)
  }, [department])

  useEffect(() => {
    setLoading(true)
    fetchActiveProducts({ department, categorySlug: categoriaSlug || undefined, search: search || undefined })
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [department, categoriaSlug, search])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (search) next.set('busca', search)
    else next.delete('busca')
    setSearchParams(next)
  }

  function selectCategory(slug: string) {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('categoria', slug)
    else next.delete('categoria')
    setSearchParams(next)
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">{title}</h1>

      <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar produto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-rose px-4 py-2 text-sm text-white hover:bg-brand-plum">
          Buscar
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => selectCategory('')}
          className={`rounded-full px-3 py-1 text-sm ${categoriaSlug === '' ? 'bg-brand-rose text-white' : 'bg-white border border-brand-rose-light'}`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.slug)}
            className={`rounded-full px-3 py-1 text-sm ${categoriaSlug === c.slug ? 'bg-brand-rose text-white' : 'bg-white border border-brand-rose-light'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-brand-black/60">Carregando…</p>
      ) : products.length === 0 ? (
        <p className="text-brand-black/60">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map(({ product, mainImage }) => (
            <ProductCard key={product.id} product={product} image={mainImage} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  )
}
