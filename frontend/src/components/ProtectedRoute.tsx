import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="py-20 text-center text-brand-black/60">Carregando…</p>
  if (!user) return <Navigate to="/entrar" state={{ from: location }} replace />
  return <Outlet />
}

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return <p className="py-20 text-center text-brand-black/60">Carregando…</p>
  if (!user || !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
