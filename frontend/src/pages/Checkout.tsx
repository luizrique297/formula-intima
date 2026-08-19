import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { fetchAddresses, createAddress, type NewAddress } from '../lib/addresses'
import { supabase } from '../lib/supabase'
import { formatPriceCents } from '../lib/format'
import { AddressForm } from '../components/AddressForm'
import type { Address } from '../types/database'

export function Checkout() {
  const { user } = useAuth()
  const { lines, totalCents } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchAddresses(user.id).then((addrs) => {
      setAddresses(addrs)
      if (addrs.length > 0) setSelectedAddressId(addrs[0].id)
      setLoading(false)
      setShowForm(addrs.length === 0)
    })
  }, [user])

  async function handleSaveAddress(address: NewAddress) {
    if (!user) return
    const created = await createAddress(user.id, address)
    setAddresses((prev) => [created, ...prev])
    setSelectedAddressId(created.id)
    setShowForm(false)
  }

  async function handleConfirm() {
    if (!selectedAddressId) return
    setSubmitting(true)
    setError(null)
    const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
      body: { address_id: selectedAddressId },
    })
    setSubmitting(false)

    if (fnError || data?.error) {
      setError(data?.error ?? 'Não foi possível iniciar o pagamento. Tente novamente.')
      return
    }

    window.location.href = data.init_point
  }

  if (loading) return <p className="py-16 text-center text-brand-black/60">Carregando…</p>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Finalizar pedido</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Endereço de entrega</h2>
        {addresses.length > 0 && !showForm && (
          <div className="mb-3 flex flex-col gap-2">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${
                  selectedAddressId === addr.id ? 'border-brand-rose bg-brand-rose-light/40' : 'border-brand-rose-light bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1"
                />
                <span>
                  <strong>{addr.recipient_name}</strong> {addr.label && `(${addr.label})`}
                  <br />
                  {addr.street}, {addr.number} {addr.complement}
                  <br />
                  {addr.neighborhood} — {addr.city}/{addr.state} — CEP {addr.postal_code}
                </span>
              </label>
            ))}
            <button onClick={() => setShowForm(true)} className="text-left text-sm text-brand-rose hover:underline">
              + Adicionar outro endereço
            </button>
          </div>
        )}
        {showForm && <AddressForm onSave={handleSaveAddress} onCancel={() => setShowForm(false)} />}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-medium">Resumo</h2>
        <div className="rounded-xl border border-brand-rose-light bg-white p-4">
          {lines.map((line) => {
            const price = line.variant.price_cents_override ?? line.product.price_cents
            return (
              <div key={line.variantId} className="flex justify-between py-1 text-sm">
                <span>
                  {line.product.name} × {line.quantity}
                </span>
                <span>{formatPriceCents(price * line.quantity)}</span>
              </div>
            )
          })}
          <div className="mt-2 flex justify-between border-t border-brand-rose-light pt-2 font-medium">
            <span>Total</span>
            <span className="text-brand-rose">{formatPriceCents(totalCents)}</span>
          </div>
        </div>
      </section>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={!selectedAddressId || submitting || lines.length === 0}
        className="w-full rounded-full bg-brand-rose py-3 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-50"
      >
        {submitting ? 'Redirecionando para pagamento…' : 'Pagar com Mercado Pago'}
      </button>
    </div>
  )
}
