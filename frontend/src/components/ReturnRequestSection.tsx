import { useEffect, useState, type FormEvent } from 'react'
import {
  createReturnRequest,
  fetchReturnRequestForOrder,
  isReturnEligible,
  RETURN_DEADLINE_DAYS,
  RETURN_REASON_LABEL,
  RETURN_STATUS_LABEL,
} from '../lib/returns'
import type { Order, ReturnRequest } from '../types/database'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  order: Order
}

export function ReturnRequestSection({ order }: Props) {
  const { user } = useAuth()
  const [existing, setExisting] = useState<ReturnRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('nao_gostei')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReturnRequestForOrder(order.id)
      .then(setExisting)
      .finally(() => setLoading(false))
  }, [order.id])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      await createReturnRequest(order.id, user.id, reason, comment)
      const created = await fetchReturnRequestForOrder(order.id)
      setExisting(created)
      setShowForm(false)
    } catch {
      setError('Não foi possível registrar a solicitação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (existing) {
    return (
      <div className="mt-6 rounded-xl border border-brand-rose-light bg-white p-4">
        <p className="text-sm font-medium text-brand-plum">Solicitação de devolução</p>
        <p className="mt-1 text-sm text-brand-black/70">
          Motivo: {RETURN_REASON_LABEL[existing.reason] ?? existing.reason}
        </p>
        <p className="mt-1 text-sm">
          Status: <span className="font-medium">{RETURN_STATUS_LABEL[existing.status]}</span>
        </p>
        {existing.admin_notes && (
          <p className="mt-2 text-sm text-brand-black/60">Observação da loja: {existing.admin_notes}</p>
        )}
      </div>
    )
  }

  if (!isReturnEligible(order.status, order.delivered_at)) return null

  return (
    <div className="mt-6 rounded-xl border border-brand-rose-light bg-white p-4">
      {!showForm ? (
        <>
          <p className="text-sm text-brand-black/70">
            Você tem até {RETURN_DEADLINE_DAYS} dias após a entrega para solicitar devolução, sem precisar
            justificar (direito de arrependimento).
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 rounded-full border border-brand-rose px-4 py-1.5 text-sm font-medium text-brand-rose hover:bg-brand-rose-light"
          >
            Solicitar devolução
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-3">
          <p className="text-sm font-medium text-brand-plum">Solicitar devolução</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          >
            {Object.entries(RETURN_REASON_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Comentário (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-full bg-brand-rose py-2 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
            >
              {submitting ? 'Enviando…' : 'Confirmar solicitação'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-brand-rose-light px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
