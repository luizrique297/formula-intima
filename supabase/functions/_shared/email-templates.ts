// Templates de e-mail transacional da Fórmula Íntima. HTML simples e
// autocontido (sem dependências externas), com a paleta de cores da marca.

const BRAND_ROSE = '#cf87a6'
const BRAND_PLUM = '#9c4a68'
const BRAND_CREAM = '#fdf6f5'

function wrapper(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; background: ${BRAND_CREAM}; padding: 32px 16px;">
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f0d8e2;">
      <div style="background: ${BRAND_PLUM}; padding: 24px; text-align: center;">
        <p style="margin: 0; color: #ffffff; font-size: 20px; letter-spacing: 1px;">Fórmula Íntima</p>
      </div>
      <div style="padding: 24px; color: #2b1620; font-size: 15px; line-height: 1.6;">
        <h1 style="font-size: 18px; color: ${BRAND_PLUM}; margin: 0 0 16px;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding: 16px 24px; background: #faeef2; text-align: center; font-size: 12px; color: #8a7078;">
        Entrega discreta, do jeito que combina com você.
      </div>
    </div>
  </div>`
}

export function welcomeEmail(fullName: string | null): { subject: string; html: string } {
  const name = fullName?.split(' ')[0] ?? 'Olá'
  return {
    subject: 'Bem-vinda à Fórmula Íntima 💗',
    html: wrapper(
      `${name}, que bom ter você aqui!`,
      `<p>Sua conta foi criada com sucesso. Agora você já pode navegar pelo catálogo, montar seu carrinho e finalizar sua compra com discrição do início ao fim.</p>
       <p style="color:#8a7078; font-size:13px;">Se você não criou essa conta, pode ignorar este e-mail.</p>`,
    ),
  }
}

export interface OrderItemSummary {
  product_name: string
  variant_label: string | null
  quantity: number
  unit_price_cents: number
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function itemsTable(items: OrderItemSummary[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0d8e2;">${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} × ${i.quantity}</td>
        <td style="padding: 6px 0; border-bottom: 1px solid #f0d8e2; text-align: right;">${formatCents(i.unit_price_cents * i.quantity)}</td>
      </tr>`,
    )
    .join('')
  return `<table style="width:100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">${rows}</table>`
}

export function orderReceivedEmail(
  fullName: string | null,
  orderId: string,
  items: OrderItemSummary[],
  totalCents: number,
): { subject: string; html: string } {
  const name = fullName?.split(' ')[0] ?? 'Olá'
  return {
    subject: 'Recebemos seu pedido 💗',
    html: wrapper(
      `${name}, seu pedido chegou até nós!`,
      `<p>Assim que o pagamento for confirmado, começamos a separar tudo com carinho.</p>
       ${itemsTable(items)}
       <p style="text-align:right; font-weight: bold; color: ${BRAND_PLUM};">Total: ${formatCents(totalCents)}</p>
       <p style="color:#8a7078; font-size:13px;">Número do pedido: ${orderId}</p>`,
    ),
  }
}

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  em_separacao: 'Em separação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_MESSAGE: Record<string, string> = {
  pago: 'Recebemos a confirmação do seu pagamento! Já estamos preparando seu pedido.',
  em_separacao: 'Seu pedido está sendo separado com todo o cuidado.',
  enviado: 'Seu pedido foi enviado e está a caminho, em embalagem discreta.',
  entregue: 'Seu pedido foi entregue. Esperamos que você ame!',
  cancelado: 'Seu pedido foi cancelado. Se não esperava por isso, é só responder este e-mail.',
}

export function orderStatusEmail(
  fullName: string | null,
  orderId: string,
  status: string,
): { subject: string; html: string } {
  const name = fullName?.split(' ')[0] ?? 'Olá'
  const label = STATUS_LABEL[status] ?? status
  const message = STATUS_MESSAGE[status] ?? 'O status do seu pedido foi atualizado.'
  return {
    subject: `Seu pedido: ${label}`,
    html: wrapper(
      `${name}, novidade no seu pedido!`,
      `<p>${message}</p>
       <p style="margin-top:16px; padding: 8px 16px; background: #faeef2; border-radius: 999px; display: inline-block; color: ${BRAND_PLUM}; font-weight: bold;">${label}</p>
       <p style="color:#8a7078; font-size:13px; margin-top:16px;">Número do pedido: ${orderId}</p>`,
    ),
  }
}
