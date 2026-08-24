// Restrito ao domínio do site: create-payment é chamada do navegador com o
// token de sessão do cliente, então não faz sentido deixar qualquer origem
// (site malicioso) tentar chamá-la. mp-webhook é server-to-server (Mercado
// Pago) e não é afetada por este header, já que CORS só é aplicado pelo
// navegador.
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://luizrique297.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
