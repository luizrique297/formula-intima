export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function publicImageUrl(storagePath: string | null): string {
  if (!storagePath) return ''
  const base = import.meta.env.VITE_SUPABASE_URL as string
  return `${base}/storage/v1/object/public/product-images/${storagePath}`
}
