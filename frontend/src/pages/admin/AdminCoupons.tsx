import { useEffect, useState, type FormEvent } from 'react'
import { createCoupon, fetchCoupons, updateCouponActive, type Coupon } from '../../lib/coupons'
import { formatPriceCents } from '../../lib/format'

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentual' | 'fixo'>('percentual')
  const [discountValue, setDiscountValue] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [minOrderReais, setMinOrderReais] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetchCoupons()
      .then(setCoupons)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value:
          discountType === 'percentual'
            ? Math.round(parseFloat(discountValue))
            : Math.round(parseFloat(discountValue.replace(',', '.')) * 100),
        valid_until: validUntil ? new Date(validUntil).toISOString() : null,
        max_uses: maxUses ? parseInt(maxUses, 10) : null,
        min_order_cents: minOrderReais ? Math.round(parseFloat(minOrderReais.replace(',', '.')) * 100) : 0,
        active: true,
      })
      setCode('')
      setDiscountValue('')
      setValidUntil('')
      setMaxUses('')
      setMinOrderReais('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cupom (código já existe?).')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    await updateCouponActive(id, active)
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)))
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Cupons de desconto</h1>

      {loading ? (
        <p className="text-brand-black/60">Carregando…</p>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl border border-brand-rose-light bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-rose-light text-brand-black/60">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Desconto</th>
                <th className="p-3">Validade</th>
                <th className="p-3">Usos</th>
                <th className="p-3">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-brand-rose-light last:border-0">
                  <td className="p-3 font-medium">{c.code}</td>
                  <td className="p-3">
                    {c.discount_type === 'percentual' ? `${c.discount_value}%` : formatPriceCents(c.discount_value)}
                    {c.min_order_cents > 0 && (
                      <span className="text-brand-black/50"> (mín. {formatPriceCents(c.min_order_cents)})</span>
                    )}
                  </td>
                  <td className="p-3">{c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-BR') : 'Sem prazo'}</td>
                  <td className="p-3">
                    {c.times_used}
                    {c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={c.active}
                      onChange={(e) => handleToggleActive(c.id, e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td className="p-3 text-brand-black/50" colSpan={5}>
                    Nenhum cupom cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-brand-rose-light bg-white p-4">
        <p className="text-sm font-medium text-brand-plum">Novo cupom</p>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Código (ex: BEMVINDA10)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percentual' | 'fixo')}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          >
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </div>
        <input
          required
          placeholder={discountType === 'percentual' ? 'Ex: 10 (para 10%)' : 'Ex: 15.00 (para R$ 15,00)'}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">Validade (opcional)</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">Limite de usos (opcional)</label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">Compra mínima (opcional)</label>
            <input
              placeholder="Ex: 100.00"
              value={minOrderReais}
              onChange={(e) => setMinOrderReais(e.target.value)}
              className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-1 self-start rounded-full bg-brand-rose px-5 py-2 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {saving ? 'Criando…' : '+ Criar cupom'}
        </button>
      </form>
    </div>
  )
}
