import { useState, type FormEvent } from 'react'
import type { NewAddress } from '../lib/addresses'
import { lookupCep } from '../lib/shipping'

interface Props {
  onSave: (address: NewAddress) => Promise<void>
  onCancel: () => void
}

const emptyForm: NewAddress = {
  label: '',
  recipient_name: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  postal_code: '',
}

export function AddressForm({ onSave, onCancel }: Props) {
  const [form, setForm] = useState<NewAddress>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)

  function update<K extends keyof NewAddress>(key: K, value: NewAddress[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleCepChange(value: string) {
    update('postal_code', value)
    setCepError(null)
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 8) return

    setCepLoading(true)
    const address = await lookupCep(digits)
    setCepLoading(false)

    if (!address) {
      setCepError('CEP não encontrado.')
      return
    }
    setForm((f) => ({ ...f, street: address.street, neighborhood: address.neighborhood, city: address.city, state: address.uf }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-brand-rose-light bg-white p-4">
      <input
        required
        placeholder="Nome de quem recebe"
        value={form.recipient_name}
        onChange={(e) => update('recipient_name', e.target.value)}
        className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <input
            required
            placeholder="CEP"
            inputMode="numeric"
            maxLength={9}
            value={form.postal_code}
            onChange={(e) => handleCepChange(e.target.value)}
            className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
          {cepLoading && <p className="mt-1 text-xs text-brand-black/50">Buscando…</p>}
          {cepError && <p className="mt-1 text-xs text-red-600">{cepError}</p>}
        </div>
        <input
          required
          placeholder="Rua"
          value={form.street}
          onChange={(e) => update('street', e.target.value)}
          className="col-span-2 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input
          required
          placeholder="Número"
          value={form.number}
          onChange={(e) => update('number', e.target.value)}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <input
          placeholder="Complemento"
          value={form.complement ?? ''}
          onChange={(e) => update('complement', e.target.value)}
          className="col-span-2 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
      </div>
      <input
        required
        placeholder="Bairro"
        value={form.neighborhood}
        onChange={(e) => update('neighborhood', e.target.value)}
        className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          required
          placeholder="Cidade"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          className="col-span-2 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="UF"
          maxLength={2}
          value={form.state}
          onChange={(e) => update('state', e.target.value.toUpperCase())}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
      </div>
      <input
        placeholder="Apelido (ex: Casa, Trabalho)"
        value={form.label ?? ''}
        onChange={(e) => update('label', e.target.value)}
        className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-full bg-brand-rose py-2 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {saving ? 'Salvando…' : 'Salvar endereço'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-brand-rose-light px-4 py-2 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  )
}
