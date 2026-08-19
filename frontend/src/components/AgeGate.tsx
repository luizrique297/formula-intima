import { useEffect, useState } from 'react'

const KEY = 'formula-intima:age-confirmed'

export function AgeGate() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(KEY) !== 'true') setVisible(true)
  }, [])

  function confirm() {
    localStorage.setItem(KEY, 'true')
    setVisible(false)
  }

  function leave() {
    window.location.href = 'https://www.google.com'
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-4">
      <div className="max-w-sm rounded-xl bg-brand-cream p-6 text-center shadow-xl">
        <h2 className="mb-2 font-serif text-xl text-brand-plum">Conteúdo para maiores de 18 anos</h2>
        <p className="mb-6 text-sm text-brand-black/80">
          Este site vende produtos de uso íntimo e adulto. Ao continuar, você confirma que tem 18 anos ou mais.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={confirm}
            className="rounded-full bg-brand-rose px-4 py-2 font-medium text-white transition hover:bg-brand-plum"
          >
            Tenho 18 anos ou mais, entrar
          </button>
          <button onClick={leave} className="rounded-full px-4 py-2 text-sm text-brand-black/60 hover:underline">
            Sair do site
          </button>
        </div>
      </div>
    </div>
  )
}
