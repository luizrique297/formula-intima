import { useEffect, useState } from 'react'
import { fetchReviewsForProduct, summarizeRatings, type ProductReview } from '../lib/reviews'

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-brand-gold">
      {'★'.repeat(Math.round(rating))}
      {'☆'.repeat(5 - Math.round(rating))}
    </span>
  )
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviewsForProduct(productId)
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return null
  const summary = summarizeRatings(reviews)

  return (
    <div className="mt-10 border-t border-brand-rose-light pt-6">
      <h2 className="mb-3 font-serif text-xl text-brand-plum">Avaliações</h2>

      {summary.count === 0 ? (
        <p className="text-sm text-brand-black/60">Ainda não há avaliações para este produto.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2">
            <Stars rating={summary.average} />
            <span className="text-sm text-brand-black/70">
              {summary.average.toFixed(1)} de 5 ({summary.count} avaliaç{summary.count === 1 ? 'ão' : 'ões'})
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-brand-rose-light bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-brand-black/50">{r.profiles?.full_name?.split(' ')[0] ?? 'Cliente'}</span>
                </div>
                {r.comment && <p className="mt-1 text-brand-black/80">{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
