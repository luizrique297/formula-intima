// Edge Function: share-product
// Gera uma página com Open Graph correto (foto, título e preço) para UM
// produto específico. Não é a página que a cliente navega — é só o alvo do
// link "Compartilhar" do produto.
//
// Por quê existe: o site é hospedado como arquivo estático no GitHub Pages,
// então toda URL do site é fisicamente o mesmo index.html (as rotas trocam
// só depois do #, que o navegador nunca envia ao servidor). Isso significa
// que não existe como o servidor saber qual produto está sendo compartilhado
// e devolver a foto/preço certos na hora — e o WhatsApp/Instagram/Facebook
// não executam o JavaScript da página ao gerar a prévia do link, só leem o
// HTML pronto que a URL devolve. Esta function resolve isso: busca o produto
// no banco, monta um HTML só com as tags de Open Graph certas, e redireciona
// (por HTML e por JavaScript, para funcionar mesmo sem JS) qualquer pessoa
// de verdade direto para a página real do produto no site — só o robô de
// prévia de link fica olhando esta página aqui.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SITE_URL = Deno.env.get('SITE_URL')!

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function redirectPage(redirectUrl: string): Response {
  const safeUrl = escapeHtml(redirectUrl)
  return new Response(
    `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="0;url=${safeUrl}" />
<script>location.replace(${JSON.stringify(redirectUrl)})</script>
</head>
<body><p>Redirecionando… <a href="${safeUrl}">Clique aqui</a> se não for automático.</p></body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const slug = url.searchParams.get('slug')
  if (!slug) return redirectPage(SITE_URL)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data: product } = await supabase
    .from('products')
    .select('id, name, slug, description, price_cents, is_active, categories(department)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) return redirectPage(SITE_URL)

  const department = (product as any).categories?.department === 'sex_shop' ? 'sex-shop' : 'lingerie'
  const pageUrl = `${SITE_URL}/#/${department}/produto/${product.slug}`

  const { data: image } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', product.id)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()

  const imageUrl = image
    ? `${SUPABASE_URL}/storage/v1/object/public/product-images/${image.storage_path}`
    : `${SITE_URL}/logo.png`

  const title = product.name
  const rawDescription = product.description ? product.description.slice(0, 140) : 'Confira este produto na Fórmula Íntima.'
  const description = `${formatPriceCents(product.price_cents)} — ${rawDescription}`

  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safePageUrl = escapeHtml(pageUrl)
  const safeImageUrl = escapeHtml(imageUrl)

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${safeTitle} — Fórmula Íntima</title>
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Fórmula Íntima" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImageUrl}" />
<meta property="og:url" content="${safePageUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImageUrl}" />
<meta http-equiv="refresh" content="0;url=${safePageUrl}" />
<script>location.replace(${JSON.stringify(pageUrl)})</script>
</head>
<body><p>Redirecionando para <a href="${safePageUrl}">${safeTitle}</a>…</p></body>
</html>`

  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
})
