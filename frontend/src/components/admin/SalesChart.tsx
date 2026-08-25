import { useMemo, useState } from 'react'
import { formatPriceCents } from '../../lib/format'
import type { AdminOrder } from '../../lib/admin'

const DAYS = 30
const INK = '#2b1620'
const INK_MUTED = '#8a7f74'
const GRID = '#e8e0d6'
const SERIES = '#9c4a68' // brand-plum — validado contra o fundo branco do card

interface DayPoint {
  key: string
  label: string
  cents: number
}

function buildDailySeries(orders: AdminOrder[]): DayPoint[] {
  const counted = orders.filter((o) => o.status !== 'aguardando_pagamento' && o.status !== 'cancelado')
  const byDay = new Map<string, number>()
  for (const o of counted) {
    const key = o.created_at.slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + o.total_cents)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const points: DayPoint[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    points.push({
      key,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      cents: byDay.get(key) ?? 0,
    })
  }
  return points
}

// Arredonda o teto do eixo Y pra um número "redondo" (em reais), não o valor
// máximo exato — assim as linhas de grade mostram números fáceis de ler.
function niceMaxReais(maxReais: number): number {
  if (maxReais <= 0) return 100
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxReais)))
  const normalized = maxReais / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

const WIDTH = 680
const HEIGHT = 220
const MARGIN = { top: 16, right: 12, bottom: 24, left: 60 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom

export function SalesChart({ orders }: { orders: AdminOrder[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const points = useMemo(() => buildDailySeries(orders), [orders])
  const totalCents = points.reduce((s, p) => s + p.cents, 0)
  const maxCents = Math.max(...points.map((p) => p.cents), 0)
  const niceMax = niceMaxReais(maxCents / 100) * 100

  function xAt(i: number) {
    return MARGIN.left + (points.length === 1 ? 0 : (i / (points.length - 1)) * PLOT_W)
  }
  function yAt(cents: number) {
    return MARGIN.top + PLOT_H - (niceMax === 0 ? 0 : (cents / niceMax) * PLOT_H)
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)},${yAt(p.cents)}`).join(' ')
  const areaPath = `${linePath} L ${xAt(points.length - 1)},${MARGIN.top + PLOT_H} L ${xAt(0)},${MARGIN.top + PLOT_H} Z`

  const gridValues = [0, niceMax / 2, niceMax]
  const tickIndexes = [0, Math.floor((points.length - 1) / 2), points.length - 1]

  const hovered = hoverIndex !== null ? points[hoverIndex] : null

  function handlePointerMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const ratio = Math.min(1, Math.max(0, relX / rect.width))
    const index = Math.round(ratio * (points.length - 1))
    setHoverIndex(index)
  }

  return (
    <div className="mt-6 rounded-xl border border-brand-rose-light bg-white p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-brand-black">Faturamento nos últimos 30 dias</p>
          <p className="mt-1 font-serif text-2xl text-brand-plum">{formatPriceCents(totalCents)}</p>
        </div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-medium text-brand-rose hover:underline"
        >
          {showTable ? 'Ver gráfico' : 'Ver como tabela'}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-brand-rose-light">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-brand-rose-light bg-brand-rose-light/60 text-brand-black/70">
              <tr>
                <th className="p-2">Dia</th>
                <th className="p-2">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.key} className="border-b border-brand-rose-light last:border-0">
                  <td className="p-2">{p.label}</td>
                  <td className="p-2">{formatPriceCents(p.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`Faturamento diário nos últimos 30 dias, total de ${formatPriceCents(totalCents)}`}>
            {gridValues.map((v, i) => (
              <g key={i}>
                <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yAt(v)} y2={yAt(v)} stroke={GRID} strokeWidth={1} />
                <text x={MARGIN.left - 8} y={yAt(v)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill={INK_MUTED}>
                  {formatPriceCents(v).replace('R$', 'R$ ')}
                </text>
              </g>
            ))}

            {tickIndexes.map((i) => (
              <text key={i} x={xAt(i)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill={INK_MUTED}>
                {points[i].label}
              </text>
            ))}

            <path d={areaPath} fill={SERIES} fillOpacity={0.1} stroke="none" />
            <path d={linePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            <circle
              cx={xAt(points.length - 1)}
              cy={yAt(points[points.length - 1].cents)}
              r={4}
              fill={SERIES}
              stroke="#ffffff"
              strokeWidth={2}
            />
            <text
              x={xAt(points.length - 1) - 6}
              y={yAt(points[points.length - 1].cents) - 10}
              textAnchor="end"
              fontSize="11"
              fontWeight="600"
              fill={INK}
            >
              {formatPriceCents(points[points.length - 1].cents)}
            </text>

            {hovered && (
              <>
                <line
                  x1={xAt(hoverIndex!)}
                  x2={xAt(hoverIndex!)}
                  y1={MARGIN.top}
                  y2={MARGIN.top + PLOT_H}
                  stroke={INK_MUTED}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <circle cx={xAt(hoverIndex!)} cy={yAt(hovered.cents)} r={5} fill={SERIES} stroke="#ffffff" strokeWidth={2} />
              </>
            )}

            <rect
              x={MARGIN.left}
              y={MARGIN.top}
              width={PLOT_W}
              height={PLOT_H}
              fill="transparent"
              onPointerMove={handlePointerMove}
              onPointerLeave={() => setHoverIndex(null)}
            />
          </svg>

          {hovered && (
            <div
              className="pointer-events-none absolute rounded-lg bg-brand-black px-2.5 py-1.5 text-xs text-white shadow-lg"
              style={{
                left: `${(xAt(hoverIndex!) / WIDTH) * 100}%`,
                top: `${(yAt(hovered.cents) / HEIGHT) * 100}%`,
                transform: 'translate(-50%, -130%)',
              }}
            >
              <p className="font-medium">{hovered.label}</p>
              <p>{formatPriceCents(hovered.cents)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
