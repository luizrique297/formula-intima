import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Privacy() {
  useDocumentTitle('Política de Privacidade')
  return (
    <div className="mx-auto max-w-2xl text-sm leading-relaxed text-brand-black/80">
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Política de Privacidade</h1>

      <p className="mb-4">
        A Fórmula Íntima respeita sua privacidade e trata seus dados pessoais em conformidade com a Lei Geral de
        Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>

      <h2 className="mb-2 mt-6 font-medium text-brand-plum">Quais dados coletamos</h2>
      <p className="mb-4">
        Nome, e-mail, telefone e endereço de entrega, usados exclusivamente para processar seu cadastro, pedidos e
        entregas. Ao entrar com Google ou Facebook, recebemos apenas nome, e-mail e foto de perfil públicos dessas
        contas.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-brand-plum">Como usamos seus dados</h2>
      <p className="mb-4">
        Seus dados são usados apenas para processar pedidos, comunicar status de entrega e cumprir obrigações legais.
        Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-brand-plum">Pagamentos</h2>
      <p className="mb-4">
        Os pagamentos são processados pelo Mercado Pago. Não armazenamos dados de cartão de crédito em nossos
        servidores.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-brand-plum">Discrição</h2>
      <p className="mb-4">
        Todos os pedidos são embalados e enviados sem identificação externa do conteúdo, e nossas comunicações não
        revelam a natureza dos produtos comprados.
      </p>

      <h2 className="mb-2 mt-6 font-medium text-brand-plum">Seus direitos</h2>
      <p className="mb-4">
        Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento entrando em contato
        conosco.
      </p>
    </div>
  )
}
