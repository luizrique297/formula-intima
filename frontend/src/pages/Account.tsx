import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile } from '../lib/profile'
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
  type NewAddress,
} from '../lib/addresses'
import { AddressForm } from '../components/AddressForm'
import type { Address } from '../types/database'

export function Account() {
  const { user, profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  useEffect(() => {
    if (!user) return
    fetchAddresses(user.id)
      .then(setAddresses)
      .finally(() => setLoadingAddresses(false))
  }, [user])

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSavingProfile(true)
    await updateProfile(user.id, fullName, phone)
    await refreshProfile()
    setSavingProfile(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  async function handleCreateAddress(address: NewAddress) {
    if (!user) return
    const created = await createAddress(user.id, address)
    setAddresses((prev) => [created, ...prev])
    setAddingNew(false)
  }

  async function handleUpdateAddress(id: string, address: NewAddress) {
    const updated = await updateAddress(id, address)
    setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)))
    setEditingId(null)
  }

  async function handleDeleteAddress(id: string) {
    await deleteAddress(id)
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Meus dados</h1>

      <section className="mb-8 rounded-xl border border-brand-rose-light bg-white p-4">
        <h2 className="mb-3 text-lg font-medium text-brand-plum">Dados pessoais</h2>
        <form onSubmit={handleProfileSubmit} className="grid gap-3">
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">E-mail</label>
            <input
              disabled
              value={user?.email ?? ''}
              className="w-full rounded-lg border border-brand-rose-light bg-brand-cream px-3 py-2 text-sm text-brand-black/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">Nome completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-black/60">Telefone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 91234-5678"
              className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="mt-1 self-start rounded-full bg-brand-rose px-5 py-2 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
          >
            {savingProfile ? 'Salvando…' : profileSaved ? 'Salvo!' : 'Salvar dados'}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-brand-plum">Endereços salvos</h2>

        {loadingAddresses ? (
          <p className="text-sm text-brand-black/60">Carregando…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {addresses.map((addr) =>
              editingId === addr.id ? (
                <AddressForm
                  key={addr.id}
                  initialValue={addr}
                  onSave={(a) => handleUpdateAddress(addr.id, a)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={addr.id} className="rounded-xl border border-brand-rose-light bg-white p-4 text-sm">
                  <p>
                    <strong>{addr.recipient_name}</strong> {addr.label && `(${addr.label})`}
                  </p>
                  <p className="text-brand-black/70">
                    {addr.street}, {addr.number} {addr.complement}
                    <br />
                    {addr.neighborhood} — {addr.city}/{addr.state} — CEP {addr.postal_code}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <button onClick={() => setEditingId(addr.id)} className="text-brand-rose hover:underline">
                      Editar
                    </button>
                    <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 hover:underline">
                      Remover
                    </button>
                  </div>
                </div>
              ),
            )}

            {addingNew ? (
              <AddressForm onSave={handleCreateAddress} onCancel={() => setAddingNew(false)} />
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                className="self-start rounded-full border border-brand-rose px-4 py-1.5 text-sm font-medium text-brand-rose hover:bg-brand-rose-light"
              >
                + Adicionar endereço
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
