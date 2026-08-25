import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  createVariant,
  deleteProductImage,
  deleteVariant,
  fetchProductForEdit,
  LOW_STOCK_THRESHOLD,
  slugify,
  updateProduct,
  updateVariantStock,
  uploadProductImage,
  type ProductFormInput,
} from '../../lib/admin'
import { fetchCategories } from '../../lib/products'
import { formatPriceCents, publicImageUrl } from '../../lib/format'
import { useToast } from '../../contexts/ToastContext'
import type { Category, Inventory, Product, ProductImage, ProductVariant } from '../../types/database'

export function AdminProductForm() {
  const { productId } = useParams<{ productId: string }>()
  const isNew = !productId || productId === 'novo'
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<(ProductVariant & { inventory: Inventory | null })[]>([])

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [priceReais, setPriceReais] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSensitive, setIsSensitive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadColor, setUploadColor] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (isNew) return
    fetchProductForEdit(productId!).then(({ product, images, variants }) => {
      if (!product) return
      setProduct(product)
      setName(product.name)
      setSlug(product.slug)
      setDescription(product.description ?? '')
      setPriceReais((product.price_cents / 100).toFixed(2))
      setCategoryId(product.category_id ?? '')
      setIsActive(product.is_active)
      setIsSensitive(product.is_sensitive)
      setImages(images)
      setVariants(variants)
    })
  }, [productId, isNew])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const priceCents = Math.round(parseFloat(priceReais.replace(',', '.')) * 100)
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError('Preço inválido — use um número, ex: 89.90.')
      return
    }

    setSaving(true)
    try {
      const input: ProductFormInput = {
        name,
        slug: slug || slugify(name),
        description: description || null,
        price_cents: priceCents,
        category_id: categoryId || null,
        is_active: isActive,
        is_sensitive: isSensitive,
      }
      if (isNew) {
        const created = await createProduct(input)
        showToast('Produto criado.')
        navigate(`/admin/produtos/${created.id}`, { replace: true })
      } else {
        await updateProduct(productId!, input)
        setProduct((p) => (p ? { ...p, ...input } : p))
        showToast('Produto salvo.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.')
      showToast('Não foi possível salvar o produto.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!product || !e.target.files?.[0]) return
    const file = e.target.files[0]
    try {
      const img = await uploadProductImage(product.id, file, images.length, uploadColor || null)
      setImages((prev) => [...prev, img])
      showToast('Foto enviada.')
    } catch {
      showToast('Não foi possível enviar a foto.', 'error')
    } finally {
      e.target.value = ''
    }
  }

  const distinctColors = [...new Set(variants.map((v) => v.color).filter((c): c is string => !!c))]

  async function handleImageDelete(img: ProductImage) {
    if (!confirm('Remover esta foto? Essa ação não pode ser desfeita.')) return
    try {
      await deleteProductImage(img)
      setImages((prev) => prev.filter((i) => i.id !== img.id))
      showToast('Foto removida.')
    } catch {
      showToast('Não foi possível remover a foto.', 'error')
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">{isNew ? 'Novo produto' : 'Editar produto'}</h1>

      <form onSubmit={handleSubmit} className="mb-8 grid gap-3 rounded-xl border border-brand-rose-light bg-white p-4">
        <input
          required
          placeholder="Nome do produto"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (isNew) setSlug(slugify(e.target.value))
          }}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="slug-do-produto"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Preço (ex: 89.90)"
            value={priceReais}
            onChange={(e) => setPriceReais(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.department === 'sex_shop' ? 'Sex Shop' : 'Lingerie'}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Produto visível na loja
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isSensitive} onChange={(e) => setIsSensitive(e.target.checked)} />
          Conteúdo sensível (avisos aplicáveis)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-brand-rose py-2.5 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {saving ? 'Salvando…' : isNew ? 'Criar produto' : 'Salvar alterações'}
        </button>
      </form>

      {!isNew && product && (
        <>
          <VariantsSection productId={product.id} variants={variants} setVariants={setVariants} />

          <section className="mb-8 mt-8">
            <h2 className="mb-3 text-lg font-medium">Fotos</h2>
            <p className="mb-3 text-sm text-brand-black/60">
              Se o produto tiver variantes de cor diferentes, associe cada foto à cor certa — a página do produto
              troca a imagem automaticamente quando a cliente escolhe a cor. Fotos sem cor definida aparecem para
              qualquer cor que ainda não tenha foto própria.
            </p>
            <div className="mb-3 flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-brand-rose-light">
                  <img src={publicImageUrl(img.storage_path)} alt="" className="h-full w-full object-cover" />
                  {img.color && (
                    <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1 text-center text-[10px] text-white">
                      {img.color}
                    </span>
                  )}
                  <button
                    onClick={() => handleImageDelete(img)}
                    className="absolute right-1 top-1 rounded-full bg-white px-1.5 text-xs text-red-600 shadow"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={uploadColor}
                onChange={(e) => setUploadColor(e.target.value)}
                className="rounded-lg border border-brand-rose-light px-2 py-1.5 text-sm"
              >
                <option value="">Todas as cores (genérica)</option>
                {distinctColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function VariantsSection({
  productId,
  variants,
  setVariants,
}: {
  productId: string
  variants: (ProductVariant & { inventory: Inventory | null })[]
  setVariants: React.Dispatch<React.SetStateAction<(ProductVariant & { inventory: Inventory | null })[]>>
}) {
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [sku, setSku] = useState('')
  const [priceOverride, setPriceOverride] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [adding, setAdding] = useState(false)
  const { showToast } = useToast()

  async function handleAddVariant(e: FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      await createVariant(
        productId,
        {
          size: size || null,
          color: color || null,
          sku: sku || null,
          price_cents_override: priceOverride ? Math.round(parseFloat(priceOverride.replace(',', '.')) * 100) : null,
        },
        parseInt(quantity, 10) || 0,
      )
      const { variants: refreshed } = await fetchProductForEdit(productId)
      setVariants(refreshed)
      setSize('')
      setColor('')
      setSku('')
      setPriceOverride('')
      setQuantity('0')
      showToast('Variante adicionada.')
    } catch {
      showToast('Não foi possível adicionar a variante.', 'error')
    } finally {
      setAdding(false)
    }
  }

  async function handleStockChange(variantId: string, quantity: number) {
    try {
      await updateVariantStock(variantId, quantity)
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, inventory: { variant_id: variantId, quantity, updated_at: '' } } : v)),
      )
      showToast('Estoque atualizado.')
    } catch {
      showToast('Não foi possível atualizar o estoque.', 'error')
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (!confirm('Remover esta variante e o estoque dela? Essa ação não pode ser desfeita.')) return
    try {
      await deleteVariant(variantId)
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
      showToast('Variante removida.')
    } catch {
      showToast('Não foi possível remover a variante.', 'error')
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-lg font-medium">Variantes e estoque</h2>

      {variants.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-brand-rose-light bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-rose-light text-brand-black/60">
              <tr>
                <th className="p-3">Tamanho</th>
                <th className="p-3">Cor</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Preço especial</th>
                <th className="p-3">Estoque</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className="border-b border-brand-rose-light last:border-0">
                  <td className="p-3">{v.size ?? '—'}</td>
                  <td className="p-3">{v.color ?? '—'}</td>
                  <td className="p-3">{v.sku ?? '—'}</td>
                  <td className="p-3">{v.price_cents_override ? formatPriceCents(v.price_cents_override) : '—'}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      defaultValue={v.inventory?.quantity ?? 0}
                      onBlur={(e) => handleStockChange(v.id, parseInt(e.target.value, 10) || 0)}
                      className={`w-20 rounded border px-2 py-1 ${
                        (v.inventory?.quantity ?? 0) <= LOW_STOCK_THRESHOLD
                          ? 'border-amber-400 bg-amber-50 text-amber-900'
                          : 'border-brand-rose-light'
                      }`}
                    />
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDeleteVariant(v.id)} className="text-red-600 hover:underline">
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAddVariant} className="flex flex-wrap gap-2 rounded-xl border border-brand-rose-light bg-white p-3">
        <input placeholder="Tamanho (ex: M)" value={size} onChange={(e) => setSize(e.target.value)} className="w-28 rounded border border-brand-rose-light px-2 py-1.5 text-sm" />
        <input placeholder="Cor" value={color} onChange={(e) => setColor(e.target.value)} className="w-28 rounded border border-brand-rose-light px-2 py-1.5 text-sm" />
        <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} className="w-28 rounded border border-brand-rose-light px-2 py-1.5 text-sm" />
        <input placeholder="Preço especial" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} className="w-32 rounded border border-brand-rose-light px-2 py-1.5 text-sm" />
        <input type="number" min={0} placeholder="Estoque inicial" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-28 rounded border border-brand-rose-light px-2 py-1.5 text-sm" />
        <button type="submit" disabled={adding} className="rounded-full bg-brand-rose px-4 py-1.5 text-sm text-white hover:bg-brand-plum disabled:opacity-60">
          {adding ? 'Adicionando…' : '+ Adicionar variante'}
        </button>
      </form>
    </section>
  )
}
