import { useEffect, useState } from 'react'
import { fetchAllShippingRates, updateShippingRate, type ShippingRate } from '../../lib/shipping'
import { formatPriceCents } from '../../lib/format'

const UF_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}

export function AdminShipping() {
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [loading, setLoading] = useState(true)
  const [savingUf, setSavingUf] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetchAllShippingRates()
      .then(setRates)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSave(uf: string, reaisValue: string) {
    const cents = Math.round(parseFloat(reaisValue.replace(',', '.') || '0') * 100)
    if (Number.isNaN(cents) || cents < 0) return
    setSavingUf(uf)
    await updateShippingRate(uf, cents)
    setRates((prev) => prev.map((r) => (r.uf === uf ? { ...r, price_cents: cents } : r)))
    setSavingUf(null)
  }

  if (loading) return <p className="text-brand-black/60">Carregando…</p>

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl text-brand-plum">Frete por estado</h1>
      <p className="mb-6 text-sm text-brand-black/60">
        Valor cobrado do cliente conforme o estado do endereço de entrega. Não é uma cotação automática dos
        Correios — são valores de partida que você pode ajustar aqui a qualquer momento (ex: depois de simular o
        frete real no site dos Correios ou no Melhor Envio, a partir do CEP de onde os pedidos são despachados).
        Deixe <strong>0,00</strong> para frete grátis.
      </p>

      <div className="overflow-x-auto rounded-xl border border-brand-rose-light bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-rose-light text-brand-black/60">
            <tr>
              <th className="p-3">Estado</th>
              <th className="p-3">Valor do frete (R$)</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.uf} className="border-b border-brand-rose-light last:border-0">
                <td className="p-3">
                  {UF_NAMES[r.uf] ?? r.uf} <span className="text-brand-black/40">({r.uf})</span>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    defaultValue={(r.price_cents / 100).toFixed(2)}
                    onBlur={(e) => handleSave(r.uf, e.target.value)}
                    disabled={savingUf === r.uf}
                    className="w-28 rounded border border-brand-rose-light px-2 py-1"
                  />
                  <span className="ml-2 text-xs text-brand-black/40">
                    {savingUf === r.uf ? 'salvando…' : formatPriceCents(r.price_cents)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
