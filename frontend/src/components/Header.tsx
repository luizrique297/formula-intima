import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

export function Header() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { totalItems } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-rose-light bg-brand-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-serif text-xl tracking-wide text-brand-plum">
          Fórmula Íntima
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-black/80 md:flex">
          <Link to="/lingerie" className="hover:text-brand-rose">
            Lingerie
          </Link>
          <Link to="/sex-shop" className="hover:text-brand-rose">
            Sex Shop
          </Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-brand-rose">
              Painel admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/carrinho" className="relative text-sm font-medium text-brand-black/80 hover:text-brand-rose">
            Carrinho
            {totalItems > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-rose text-xs text-white">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-sm font-medium text-brand-black/80 hover:text-brand-rose"
              >
                {profile?.full_name?.split(' ')[0] ?? 'Minha conta'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-brand-rose-light bg-white py-2 text-left shadow-lg">
                  <Link
                    to="/minha-conta/pedidos"
                    className="block px-4 py-2 text-sm hover:bg-brand-rose-light"
                    onClick={() => setMenuOpen(false)}
                  >
                    Meus pedidos
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-brand-rose-light"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/entrar"
              className="rounded-full bg-brand-rose px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-plum"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
