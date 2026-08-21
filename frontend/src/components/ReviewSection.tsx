import { useEffect, useState } from 'react'
import { createReview, fetchReviewableItems, type ReviewableItem } from '../lib/reviews'
import { useAuth } from '../contexts/AuthContext'
import type { Order } from '../types/database'

export function ReviewSection({ order }: { order: Order }) {
  const { user } = useAuth()
  const [items, setItems] = useState<ReviewableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openProductId, setOpenProductId] = useState<string | null>(null)

  useEffect(() => {
    if (order.status !== 'entregue') {
      setLoading(false)
      return
    }
    fetchReviewableItems(order.id)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [order.id, order.status])

  if (loading || order.status !== 'entregue' || items.length === 0) return null

  async function handleSubmitted(productId: string) {
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, already_reviewed: true } : i)))
    setOpenProductId(null)
  }

  return (
    <div className="mt-6 rounded-xl border border-brand-rose-light bg-white p-4">
      <p className="mb-3 text-sm font-medium text-brand-plum">Avalie seus produtos</p>
      <div className="flex flex-col gap-2">
        {items.map((item) =>
          item.already_reviewed ? (
            <p key={item.product_id} className="text-sm text-brand-black/60">
              ✓ {item.product_name} — avaliado, obrigada!
            </p>
          ) : openProductId === item.product_id ? (
            <ReviewForm
              key={item.product_id}
              orderId={order.id}
              productId={item.product_id}
              productName={item.product_name}
              userId={user!.id}
              onDone={() => handleSubmitted(item.product_id)}
              onCancel={() => setOpenProductId(null)}
            />
          ) : (
            <div key={item.product_id} className="flex items-center justify-between text-sm">
              <span>{item.product_name}</span>
              <button
                onClick={() => setOpenProductId(item.product_id)}
                className="rounded-full border border-brand-rose px-3 py-1 text-xs font-medium text-brand-rose hover:bg-brand-rose-light"
              >
                Avaliar
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function ReviewForm({
  orderId,
  productId,
  productName,
  userId,
  onDone,
  onCancel,
}: {
  orderId: string
  productId: string
  productName: string
  userId: string
  onDone: () => void
  onCancel: () => void
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    await createReview(orderId, productId, userId, rating, comment)
    setSubmitting(false)
    onDone()
  }

  return (
    <div className="rounded-lg border border-brand-rose-light p-3">
      <p className="mb-2 text-sm font-medium">{productName}</p>
      <div className="mb-2 flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-full bg-brand-rose px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Enviar avaliação'}
        </button>
        <button onClick={onCancel} className="rounded-full border border-brand-rose-light px-4 py-1.5 text-sm">
          Cancelar
        </button>
      </div>
    </div>
  )
}
