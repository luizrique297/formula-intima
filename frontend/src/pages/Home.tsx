import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-2xl bg-gradient-to-br from-brand-plum to-brand-rose px-6 py-16 text-center text-white">
        <h1 className="font-serif text-3xl md:text-5xl">Sedução, conforto e cuidado com você</h1>
        <p className="mx-auto mt-4 max-w-lg text-white/90">
          Lingerie e produtos íntimos selecionados com carinho. Entrega discreta em todo o Brasil.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Link
          to="/lingerie"
          className="group flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-rose-light p-8 text-left transition hover:shadow-lg"
        >
          <h2 className="font-serif text-2xl text-brand-plum">Lingerie</h2>
          <p className="mt-2 text-sm text-brand-black/70">
            Conjuntos, sutiãs, calcinhas e camisolas para todos os momentos.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand-rose group-hover:underline">
            Ver catálogo →
          </span>
        </Link>

        <Link
          to="/sex-shop"
          className="group flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-plum p-8 text-left text-white transition hover:shadow-lg"
        >
          <h2 className="font-serif text-2xl">Sex Shop</h2>
          <p className="mt-2 text-sm text-white/80">
            Produtos íntimos para maiores de 18 anos, com discrição do início ao fim.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand-gold group-hover:underline">
            Ver catálogo (18+) →
          </span>
        </Link>
      </section>
    </div>
  )
}
