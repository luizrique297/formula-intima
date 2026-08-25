import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Página não encontrada')
  return (
    <div className="py-20 text-center">
      <h1 className="mb-2 font-serif text-3xl text-brand-plum">404</h1>
      <p className="mb-4 text-brand-black/60">Página não encontrada.</p>
      <Link to="/" className="text-brand-rose hover:underline">
        Voltar à loja
      </Link>
    </div>
  )
}
