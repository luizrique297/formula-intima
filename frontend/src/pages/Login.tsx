import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Login() {
  const [mode, setMode] = useState<'entrar' | 'cadastrar' | 'recuperar'>('entrar')
  useDocumentTitle('Entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signInWithPassword, signUpWithPassword, signInWithGoogle, sendPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    if (mode === 'entrar') {
      const { error } = await signInWithPassword(email, password)
      setSubmitting(false)
      if (error) return setError(traduzErro(error))
      navigate(from, { replace: true })
    } else if (mode === 'cadastrar') {
      const { error } = await signUpWithPassword(email, password, fullName)
      setSubmitting(false)
      if (error) return setError(traduzErro(error))
      setInfo('Cadastro criado! Verifique seu e-mail para confirmar a conta antes de entrar.')
    } else {
      const { error } = await sendPasswordReset(email)
      setSubmitting(false)
      if (error) return setError(traduzErro(error))
      setInfo('Se esse e-mail tiver uma conta, enviamos um link para redefinir a senha.')
    }
  }

  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-6 text-center font-serif text-2xl text-brand-plum">
        {mode === 'entrar' ? 'Entrar na sua conta' : mode === 'cadastrar' ? 'Criar sua conta' : 'Recuperar senha'}
      </h1>

      {mode !== 'recuperar' && (
        <>
          <div className="mb-6 flex flex-col gap-3">
            <button
              onClick={signInWithGoogle}
              className="flex items-center justify-center gap-2 rounded-full border border-brand-rose-light bg-white py-2.5 text-sm font-medium text-brand-black hover:bg-brand-rose-light"
            >
              Continuar com Google
            </button>
          </div>

          <div className="mb-6 flex items-center gap-3 text-xs text-brand-black/50">
            <div className="h-px flex-1 bg-brand-rose-light" />
            ou com e-mail
            <div className="h-px flex-1 bg-brand-rose-light" />
          </div>
        </>
      )}

      {mode === 'recuperar' && (
        <p className="mb-6 text-center text-sm text-brand-black/60">
          Digite o e-mail da sua conta — vamos enviar um link para você criar uma senha nova.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {mode === 'cadastrar' && (
          <input
            type="text"
            required
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
        )}
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
        />
        {mode !== 'recuperar' && (
          <input
            type="password"
            required
            minLength={mode === 'cadastrar' ? 8 : undefined}
            placeholder={mode === 'cadastrar' ? 'Senha (mínimo 8 caracteres)' : 'Senha'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-brand-rose-light px-3 py-2 text-sm"
          />
        )}

        {mode === 'entrar' && (
          <button
            type="button"
            onClick={() => {
              setMode('recuperar')
              setError(null)
              setInfo(null)
            }}
            className="self-end text-xs text-brand-rose hover:underline"
          >
            Esqueci minha senha
          </button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-brand-rose py-2.5 text-sm font-medium text-white hover:bg-brand-plum disabled:opacity-60"
        >
          {submitting
            ? 'Aguarde…'
            : mode === 'entrar'
              ? 'Entrar'
              : mode === 'cadastrar'
                ? 'Criar conta'
                : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-brand-black/70">
        {mode === 'entrar' && (
          <>
            Ainda não tem conta?{' '}
            <button className="font-medium text-brand-rose hover:underline" onClick={() => setMode('cadastrar')}>
              Cadastre-se
            </button>
          </>
        )}
        {mode === 'cadastrar' && (
          <>
            Já tem conta?{' '}
            <button className="font-medium text-brand-rose hover:underline" onClick={() => setMode('entrar')}>
              Entrar
            </button>
          </>
        )}
        {mode === 'recuperar' && (
          <button className="font-medium text-brand-rose hover:underline" onClick={() => setMode('entrar')}>
            Voltar para o login
          </button>
        )}
      </p>

      <p className="mt-4 text-center text-xs text-brand-black/40">
        Ao continuar, você confirma ser maior de 18 anos e concorda com os{' '}
        <Link to="/termos" className="underline">
          Termos de Uso
        </Link>{' '}
        e a{' '}
        <Link to="/privacidade" className="underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  )
}

function traduzErro(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('already registered')) return 'Este e-mail já está cadastrado.'
  return msg
}
