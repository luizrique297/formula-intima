import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFavorites } from '../contexts/FavoritesContext'

interface Props {
  productId: string
  className?: string
}

export function FavoriteButton({ productId, className }: Props) {
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()
  const navigate = useNavigate()
  const active = isFavorite(productId)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/entrar')
      return
    }
    toggleFavorite(productId)
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg shadow transition hover:scale-105 ${className ?? ''}`}
    >
      {active ? '❤️' : '🤍'}
    </button>
  )
}
