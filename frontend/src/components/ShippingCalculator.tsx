import { useState, type FormEvent } from 'react'
import { lookupCep, fetchShippingRateByUf } from '../lib/shipping'
import { formatPriceCents } from '../lib/format'

export function ShippingCalculator() {
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ city: string; uf: string; priceCents: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const address = await lookupCep(cep)
      if (!address) {
        setError('CEP não encontrado. Confira e tente de novo.')
        return
      }
      const priceCents = await fetchShippingRateByUf(address.uf)
      if (priceCents === null) {
        setError('Não conseguimos calcular o frete para esse estado no momento.')
        return
      }
      setResult({ city: address.city, uf: address.uf, priceCents })
    } catch {
      setError('Erro ao calcular o frete. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand-rose-light bg-white p-4">
      <p className="mb-2 text-sm font-medium text-brand-black">Calcular frete e prazo</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Digite seu CEP"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          maxLength={9}
          className="flex-1 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-rose px-4 py-2 text-sm text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {loading ? '...' : 'Calcular'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {result && (
        <p className="mt-3 text-sm text-brand-black/80">
          Entrega em <strong>{result.city}/{result.uf}</strong>:{' '}
          {result.priceCents === 0 ? (
            <span className="font-medium text-green-700">Grátis</span>
          ) : (
            <span className="font-medium">{formatPriceCents(result.priceCents)}</span>
          )}{' '}
          <span className="text-brand-black/50">via PAC (Correios), 5 a 15 dias úteis</span>
        </p>
      )}

      <p className="mt-2 text-xs text-brand-black/40">
        Não sabe seu CEP?{' '}
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Consultar no site dos Correios
        </a>
      </p>
    </div>
  )
}
