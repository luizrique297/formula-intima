import { useEffect, useState } from 'react'
import { fetchReturnRequestsAdmin, updateReturnRequestStatus, type AdminReturnRequest } from '../../lib/admin'
import { RETURN_REASON_LABEL, RETURN_STATUS_LABEL } from '../../lib/returns'
import { formatPriceCents } from '../../lib/format'
import { useToast } from '../../contexts/ToastContext'
import type { ReturnStatus } from '../../types/database'

const STATUS_OPTIONS: ReturnStatus[] = ['solicitado', 'aprovado', 'rejeitado', 'concluido']

export function AdminReturns() {
  const [requests, setRequests] = useState<AdminReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const { showToast } = useToast()

  function load() {
    setLoading(true)
    fetchReturnRequestsAdmin()
      .then(setRequests)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleStatusChange(id: string, status: ReturnStatus) {
    const notes = notesDraft[id]
    try {
      await updateReturnRequestStatus(id, status, notes ?? null)
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, admin_notes: notes ?? r.admin_notes } : r)))
      showToast('Devolução atualizada. A cliente será avisada por e-mail.')
    } catch {
      showToast('Não foi possível atualizar a devolução. Tente de novo.', 'error')
    }
  }

  if (loading) return <p className="text-brand-black/60">Carregando…</p>

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Devoluções</h1>

      {requests.length === 0 ? (
        <p className="text-brand-black/60">Nenhuma solicitação de devolução até agora.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-brand-rose-light bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{r.profiles?.full_name ?? 'Cliente'}</p>
                  <p className="text-xs text-brand-black/50">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as ReturnStatus)}
                  className="rounded-lg border border-brand-rose-light px-2 py-1 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {RETURN_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <p className="mt-2 text-sm">
                <strong>Motivo:</strong> {RETURN_REASON_LABEL[r.reason] ?? r.reason}
              </p>
              {r.comment && <p className="mt-1 text-sm text-brand-black/70">"{r.comment}"</p>}
              {r.orders && (
                <p className="mt-1 text-xs text-brand-black/50">
                  Pedido {r.orders.id} — {formatPriceCents(r.orders.total_cents)}
                </p>
              )}

              <textarea
                placeholder="Observação para a cliente (opcional, salva junto com a próxima mudança de status)"
                defaultValue={r.admin_notes ?? ''}
                onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                rows={2}
                className="mt-3 w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
