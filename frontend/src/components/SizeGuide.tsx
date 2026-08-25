import { useState } from 'react'

const BRA_SIZES = [
  { size: '34', band: '73 – 77', bust: '85 – 89' },
  { size: '36', band: '78 – 82', bust: '90 – 94' },
  { size: '38', band: '83 – 87', bust: '95 – 99' },
  { size: '40', band: '88 – 92', bust: '100 – 104' },
  { size: '42', band: '93 – 97', bust: '105 – 109' },
  { size: '44', band: '98 – 102', bust: '110 – 114' },
]

const GENERAL_SIZES = [
  { size: 'PP', hip: 'até 90' },
  { size: 'P', hip: '91 – 96' },
  { size: 'M', hip: '97 – 102' },
  { size: 'G', hip: '103 – 108' },
  { size: 'GG', hip: '109 – 114' },
]

// Guia geral (referência de mercado) — não substitui a etiqueta de cada
// fabricante, que pode variar um pouco de modelo pra modelo.
export function SizeGuide() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-brand-rose hover:underline"
      >
        Guia de tamanhos
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-brand-cream p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="font-serif text-xl text-brand-plum">Guia de tamanhos</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-brand-black/40 hover:text-brand-black"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-xs text-brand-black/60">
              Medidas de referência em centímetros. Como o caimento pode variar um pouco entre modelos, em caso de
              dúvida entre dois tamanhos, prefira o maior.
            </p>

            <h3 className="mb-2 text-sm font-medium text-brand-plum">Sutiã</h3>
            <p className="mb-2 text-xs text-brand-black/60">
              Contorno: meça rente embaixo dos seios. Busto: meça na altura mais cheia dos seios.
            </p>
            <div className="mb-5 overflow-hidden rounded-lg border border-brand-rose-light">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-rose-light/60 text-brand-black/70">
                  <tr>
                    <th className="p-2">Tamanho</th>
                    <th className="p-2">Contorno (cm)</th>
                    <th className="p-2">Busto (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {BRA_SIZES.map((row) => (
                    <tr key={row.size} className="border-t border-brand-rose-light">
                      <td className="p-2 font-medium">{row.size}</td>
                      <td className="p-2">{row.band}</td>
                      <td className="p-2">{row.bust}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-2 text-sm font-medium text-brand-plum">Calcinha e demais peças</h3>
            <p className="mb-2 text-xs text-brand-black/60">Meça a parte mais larga do quadril.</p>
            <div className="overflow-hidden rounded-lg border border-brand-rose-light">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-rose-light/60 text-brand-black/70">
                  <tr>
                    <th className="p-2">Tamanho</th>
                    <th className="p-2">Quadril (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {GENERAL_SIZES.map((row) => (
                    <tr key={row.size} className="border-t border-brand-rose-light">
                      <td className="p-2 font-medium">{row.size}</td>
                      <td className="p-2">{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
