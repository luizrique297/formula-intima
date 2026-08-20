import { useEffect, useState, type FormEvent } from 'react'
import { createCategory, slugify } from '../../lib/admin'
import { fetchCategories } from '../../lib/products'
import type { Category, Department } from '../../types/database'

const DEPARTMENT_LABEL: Record<Department, string> = {
  lingerie: 'Lingerie',
  sex_shop: 'Sex Shop (18+)',
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [department, setDepartment] = useState<Department>('lingerie')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await createCategory(name, slugify(name), department)
      setName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-brand-plum">Categorias</h1>
      <p className="mb-6 text-sm text-brand-black/60">
        Toda categoria pertence a uma área (Lingerie ou Sex Shop). O aviso de 18+ só aparece para clientes na área
        Sex Shop.
      </p>

      {loading ? (
        <p className="text-brand-black/60">Carregando…</p>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl border border-brand-rose-light bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-rose-light text-brand-black/60">
              <tr>
                <th className="p-3">Nome</th>
                <th className="p-3">Área</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-brand-rose-light last:border-0">
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{DEPARTMENT_LABEL[c.department]}</td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td className="p-3 text-brand-black/50" colSpan={2}>
                    Nenhuma categoria cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-brand-rose-light bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-brand-black/60">Nome da categoria</label>
          <input
            required
            placeholder="Ex: Conjuntos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-brand-black/60">Área</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value as Department)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          >
            <option value="lingerie">Lingerie</option>
            <option value="sex_shop">Sex Shop (18+)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-brand-rose px-4 py-2 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {saving ? 'Criando…' : '+ Criar categoria'}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}
