import { Link } from 'react-router-dom'

const DIFERENCIAIS = [
  {
    title: 'Discrição do início ao fim',
    text: 'Embalagem neutra, sem identificação do conteúdo, e comunicação discreta em todas as etapas da compra.',
  },
  {
    title: 'Compra segura',
    text: 'Pagamento processado com segurança, seus dados protegidos e nunca compartilhados com terceiros.',
  },
  {
    title: 'Curadoria com carinho',
    text: 'Cada peça é escolhida pensando em conforto, qualidade e caimento — não só em estar na moda.',
  },
  {
    title: 'Atendimento próximo',
    text: 'Dúvida sobre tamanho, tecido ou uso? É só chamar, sem robô e sem enrolação.',
  },
]

export function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="rounded-2xl bg-gradient-to-br from-brand-plum to-brand-rose px-6 py-16 text-center text-white">
        <h1 className="font-serif text-3xl md:text-5xl">Você, em primeiro lugar</h1>
        <p className="mx-auto mt-4 max-w-xl text-white/90">
          Lingerie e produtos íntimos pensados para o seu corpo, no seu tempo, do seu jeito. Entrega discreta em
          todo o Brasil.
        </p>
      </section>

      <section className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-2xl text-brand-plum">Autoestima não é sobre o outro. É sobre você.</h2>
        <p className="mt-4 text-brand-black/75">
          Acreditamos que se sentir bem no próprio corpo não é vaidade — é liberdade. Cada mulher tem seu ritmo,
          sua forma e sua história, e a Fórmula Íntima existe para acompanhar isso: te ajudar a se vestir (e se
          despir) pra você mesma, sem julgamento, sem padrão único e sem pressa.
        </p>
        <p className="mt-4 text-brand-black/75">
          Aqui, prazer e conforto não são tabu — são cuidado. Seja para o dia a dia, para uma ocasião especial ou
          só para você se olhar no espelho e gostar do que vê.
        </p>
      </section>

      <section>
        <h2 className="mb-6 text-center font-serif text-2xl text-brand-plum">Por que comprar com a gente</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFERENCIAIS.map((item) => (
            <div key={item.title} className="rounded-xl border border-brand-rose-light bg-white p-5 text-left">
              <p className="font-medium text-brand-plum">{item.title}</p>
              <p className="mt-2 text-sm text-brand-black/70">{item.text}</p>
            </div>
          ))}
        </div>
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

      <section className="rounded-2xl bg-brand-rose-light px-6 py-12 text-center">
        <h2 className="font-serif text-2xl text-brand-plum">Feito por e para quem se coloca em primeiro lugar</h2>
        <p className="mx-auto mt-3 max-w-lg text-brand-black/75">
          Se vista, se cuide e se sinta bem — do seu jeito. A gente cuida da discrição, você cuida de você.
        </p>
      </section>
    </div>
  )
}
