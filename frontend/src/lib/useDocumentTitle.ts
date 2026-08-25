import { useEffect } from 'react'

const SITE_NAME = 'Fórmula Íntima'

// Sem isso, toda página do site mostra o mesmo título genérico na aba do
// navegador e no resultado de busca do Google — inclusive cada produto
// diferente. Não resolve o preview de link no WhatsApp/Instagram (esses
// aplicativos não executam o JavaScript da página, só leem o HTML original),
// mas melhora de verdade a indexação no Google, que executa o site antes de
// indexar.
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME

    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
  }, [title, description])
}
