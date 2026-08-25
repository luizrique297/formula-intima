import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchFavoriteProducts, type FavoriteProduct } from '../lib/favorites'
import { ProductCard } from '../components/ProductCard'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Favorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)
  useDocumentTitle('Meus favoritos')

  useEffect(() => {
    if (!user) return
    fetchFavoriteProducts(user.id)
      .then(setFavorites)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Meus favoritos</h1>

      {loading ? (
        <p className="text-brand-black/60">Carregando…</p>
      ) : favorites.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-brand-black/60">Você ainda não favoritou nenhum produto.</p>
          <Link to="/" className="mt-2 inline-block text-brand-rose hover:underline">
            Ver catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {favorites.map(({ product, mainImage }) => (
            <ProductCard
              key={product.id}
              product={product}
              image={mainImage}
              basePath={product.categories?.department === 'sex_shop' ? '/sex-shop' : '/lingerie'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
