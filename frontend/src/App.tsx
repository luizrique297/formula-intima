import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { SexShopLayout } from './components/SexShopLayout'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { Catalog } from './pages/Catalog'
import { ProductDetail } from './pages/ProductDetail'
import { Cart } from './pages/Cart'
import { Checkout } from './pages/Checkout'
import { OrderStatus } from './pages/OrderStatus'
import { Orders } from './pages/Orders'
import { Account } from './pages/Account'
import { Favorites } from './pages/Favorites'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { NotFound } from './pages/NotFound'

// Carregadas sob demanda: quem nunca visita /admin (a esmagadora maioria
// das visitas à loja) nunca baixa esse código — antes ele vinha embutido
// no mesmo arquivo que toda cliente comum carregava.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts })))
const AdminProductForm = lazy(() =>
  import('./pages/admin/AdminProductForm').then((m) => ({ default: m.AdminProductForm })),
)
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })))
const AdminCategories = lazy(() =>
  import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })),
)
const AdminShipping = lazy(() => import('./pages/admin/AdminShipping').then((m) => ({ default: m.AdminShipping })))
const AdminReturns = lazy(() => import('./pages/admin/AdminReturns').then((m) => ({ default: m.AdminReturns })))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons })))

function AdminFallback() {
  return <p className="text-brand-black/60">Carregando painel…</p>
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="lingerie" element={<Catalog department="lingerie" title="Lingerie" />} />
          <Route path="lingerie/produto/:slug" element={<ProductDetail />} />

          <Route element={<SexShopLayout />}>
            <Route path="sex-shop" element={<Catalog department="sex_shop" title="Sex Shop" />} />
            <Route path="sex-shop/produto/:slug" element={<ProductDetail />} />
          </Route>

          <Route path="carrinho" element={<Cart />} />
          <Route path="entrar" element={<Login />} />
          <Route path="redefinir-senha" element={<ResetPassword />} />
          <Route path="privacidade" element={<Privacy />} />
          <Route path="termos" element={<Terms />} />
          <Route path="pedido/:orderId" element={<OrderStatus />} />

          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<Checkout />} />
            <Route path="minha-conta" element={<Account />} />
            <Route path="minha-conta/pedidos" element={<Orders />} />
            <Route path="favoritos" element={<Favorites />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route
              path="admin"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="produtos" element={<AdminProducts />} />
              <Route path="produtos/:productId" element={<AdminProductForm />} />
              <Route path="categorias" element={<AdminCategories />} />
              <Route path="frete" element={<AdminShipping />} />
              <Route path="devolucoes" element={<AdminReturns />} />
              <Route path="cupons" element={<AdminCoupons />} />
              <Route path="pedidos" element={<AdminOrders />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
