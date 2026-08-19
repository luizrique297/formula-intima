import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveProducts, fetchCategories, type ProductListItem } from '../lib/products'
import { ProductCard } from '../components/ProductCard'
import type { Category } from '../types/database'

export function Home() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchActiveProducts(), fetchCategories()])
      .then(([p, c]) => {
        setProducts(p.slice(0, 8))
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-plum to-brand-rose px-6 py-16 text-center text-white">
        <h1 className="font-serif text-3xl md:text-5xl">Sedução, conforto e cuidado com você</h1>
        <p className="mx-auto mt-4 max-w-lg text-white/90">
          Lingerie e produtos íntimos selecionados com carinho. Entrega discreta em todo o Brasil.
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 font-medium text-brand-plum hover:bg-brand-rose-light"
        >
          Ver catálogo
        </Link>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl text-brand-plum">Categorias</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/catalogo?categoria=${c.slug}`}
                className="rounded-full border border-brand-rose-light bg-white px-4 py-2 text-sm hover:bg-brand-rose-light"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-serif text-2xl text-brand-plum">Novidades</h2>
        {loading ? (
          <p className="text-brand-black/60">Carregando produtos…</p>
        ) : products.length === 0 ? (
          <p className="text-brand-black/60">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map(({ product, mainImage }) => (
              <ProductCard key={product.id} product={product} image={mainImage} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
