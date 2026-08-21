import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface FavoritesContextValue {
  favoriteIds: Set<string>
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id)
      .then(({ data }) => setFavoriteIds(new Set((data ?? []).map((f) => f.product_id))))
  }, [user])

  async function toggleFavorite(productId: string) {
    if (!user) return
    const isFav = favoriteIds.has(productId)
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId)
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId })
      setFavoriteIds((prev) => new Set(prev).add(productId))
    }
  }

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, isFavorite: (id) => favoriteIds.has(id), toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites deve ser usado dentro de FavoritesProvider')
  return ctx
}
