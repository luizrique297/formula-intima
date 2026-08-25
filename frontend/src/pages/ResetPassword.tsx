import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Chegamos aqui pelo link do e-mail de recuperação de senha. O Supabase já
// troca o código da URL por uma sessão temporária antes desta página montar
// (ver flowType 'pkce' em lib/supabase.ts), então só falta pedir a nova senha.
export function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }

    setDone(true)
    setTimeout(() => navigate('/'), 2500)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm py-8 text-center">
        <h1 className="mb-3 font-serif text-2xl text-brand-plum">Senha atualizada!</h1>
        <p className="text-sm text-brand-black/70">Redirecionando para a loja…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-2 text-center font-serif text-2xl text-brand-plum">Nova senha</h1>
      <p className="mb-6 text-center text-sm text-brand-black/60">Escolha uma nova senha para sua conta.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          required
          minLength={8}
          placeholder="Nova senha (mínimo 8 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-brand-rose py-2.5 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {submitting ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}
