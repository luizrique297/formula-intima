// Envio de e-mail via Resend (resend.com). RESEND_FROM pode ser trocado
// depois para um domínio próprio verificado, sem alterar nada mais aqui.
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Fórmula Íntima <onboarding@resend.dev>'

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error(`Falha ao enviar e-mail para ${to}: ${errText}`)
  }
}
