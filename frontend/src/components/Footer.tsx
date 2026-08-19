import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-rose-light bg-white py-8 text-sm text-brand-black/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:justify-between">
        <div>
          <p className="font-serif text-lg text-brand-plum">Fórmula Íntima</p>
          <p className="mt-1 max-w-xs">Entrega discreta, embalagem sem identificação do conteúdo.</p>
        </div>
        <div className="flex gap-6">
          <Link to="/privacidade" className="hover:text-brand-rose">
            Política de Privacidade
          </Link>
          <Link to="/termos" className="hover:text-brand-rose">
            Termos de Uso
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-brand-black/50">
        © {new Date().getFullYear()} Fórmula Íntima. Venda para maiores de 18 anos.
      </p>
    </footer>
  )
}
