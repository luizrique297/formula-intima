import { useState, type FormEvent } from 'react'
import type { NewAddress } from '../lib/addresses'

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

  function update<K extends keyof NewAddress>(key: K, value: NewAddress[K]) {
    setForm((f) => ({ ...f, [key]: value }))
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
        <input
          required
          placeholder="CEP"
          value={form.postal_code}
          onChange={(e) => update('postal_code', e.target.value)}
          className="col-span-1 rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
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
