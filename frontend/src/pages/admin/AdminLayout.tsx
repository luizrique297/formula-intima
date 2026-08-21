import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-brand-rose text-white' : 'text-brand-black/70 hover:bg-brand-rose-light'}`

export function AdminLayout() {
  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav className="flex flex-row gap-1 md:flex-col">
        <NavLink to="/admin" end className={linkClass}>
          Resumo
        </NavLink>
        <NavLink to="/admin/produtos" className={linkClass}>
          Produtos
        </NavLink>
        <NavLink to="/admin/categorias" className={linkClass}>
          Categorias
        </NavLink>
        <NavLink to="/admin/frete" className={linkClass}>
          Frete
        </NavLink>
        <NavLink to="/admin/devolucoes" className={linkClass}>
          Devoluções
        </NavLink>
        <NavLink to="/admin/cupons" className={linkClass}>
          Cupons
        </NavLink>
        <NavLink to="/admin/pedidos" className={linkClass}>
          Pedidos
        </NavLink>
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  )
}
