// Gera, para cada produto ativo, um arquivo HTML estático de compartilhamento
// (dist/produto/<slug>/index.html) com as tags de Open Graph corretas (foto,
// título, preço) e um redirecionamento automático para a página real do
// produto no site.
//
// Por que isso existe aqui e não numa Edge Function do Supabase: o Supabase
// reescreve toda resposta "text/html" de Edge Function acessada por GET no
// domínio padrão para "text/plain" (só permite HTML de verdade com domínio
// próprio, que é recurso pago) — então servir essas páginas não funciona lá.
// O GitHub Pages, por servir arquivo estático puro, não tem essa limitação:
// cada arquivo gerado aqui vira uma URL de verdade no próprio domínio do
// site, e o WhatsApp/Instagram/Facebook conseguem ler as tags direto, sem
// precisar executar nenhum JavaScript.
//
// Roda depois do "vite build" (ver .github/workflows/deploy.yml), então
// escreve direto na pasta `dist` que o Vite acabou de gerar.
import { writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const SITE_ORIGIN = 'https://luizrique297.github.io'
const BASE_PATH = process.env.VITE_BASE_PATH ?? '/'
const DIST_DIR = resolve(process.cwd(), 'dist')

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados — pulando geração de páginas de compartilhamento.')
  process.exit(0)
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatPriceCents(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function fetchActiveProducts() {
  const url =
    `${SUPABASE_URL}/rest/v1/products` +
    `?select=slug,name,description,price_cents,is_active,categories(department),product_images(storage_path,position)` +
    `&is_active=eq.true`
  const response = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!response.ok) throw new Error(`Falha ao buscar produtos: ${response.status} ${await response.text()}`)
  return response.json()
}

function buildHtml(product) {
  const department = product.categories?.department === 'sex_shop' ? 'sex-shop' : 'lingerie'
  const pageUrl = `${SITE_ORIGIN}${BASE_PATH}produto/${product.slug}/`
  const redirectUrl = `${SITE_ORIGIN}${BASE_PATH}#/${department}/produto/${product.slug}`

  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position)
  const imageUrl = images[0]
    ? `${SUPABASE_URL}/storage/v1/object/public/product-images/${images[0].storage_path}`
    : `${SITE_ORIGIN}${BASE_PATH}logo.png`

  const rawDescription = product.description ? product.description.slice(0, 140) : 'Confira este produto na Fórmula Íntima.'
  const description = `${formatPriceCents(product.price_cents)} — ${rawDescription}`

  const safeTitle = escapeHtml(product.name)
  const safeDescription = escapeHtml(description)
  const safePageUrl = escapeHtml(pageUrl)
  const safeImageUrl = escapeHtml(imageUrl)
  const safeRedirectUrl = escapeHtml(redirectUrl)

  return `<!doctype html>
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
<meta http-equiv="refresh" content="0;url=${safeRedirectUrl}" />
<script>location.replace(${JSON.stringify(redirectUrl)})</script>
</head>
<body><p>Redirecionando para <a href="${safeRedirectUrl}">${safeTitle}</a>…</p></body>
</html>`
}

function buildSitemap(products) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = [
    `${SITE_ORIGIN}${BASE_PATH}`,
    ...products.map((p) => `${SITE_ORIGIN}${BASE_PATH}produto/${p.slug}/`),
  ]
  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeHtml(url)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

const products = await fetchActiveProducts()

for (const product of products) {
  const dir = resolve(DIST_DIR, 'produto', product.slug)
  await mkdir(dir, { recursive: true })
  await writeFile(resolve(dir, 'index.html'), buildHtml(product), 'utf-8')
}

// sitemap.xml: lista a home e a página estática de cada produto (as únicas
// URLs do site com conteúdo real e distinto por trás — as rotas internas do
// app, depois do #, não valem a pena listar aqui, pois o Google trata todas
// como o mesmo documento).
await writeFile(resolve(DIST_DIR, 'sitemap.xml'), buildSitemap(products), 'utf-8')

console.log(`Páginas de compartilhamento e sitemap gerados para ${products.length} produto(s).`)
