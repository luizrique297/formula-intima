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
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { NotFound } from './pages/NotFound'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminProductForm } from './pages/admin/AdminProductForm'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminCategories } from './pages/admin/AdminCategories'
import { AdminShipping } from './pages/admin/AdminShipping'
import { AdminReturns } from './pages/admin/AdminReturns'

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
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="produtos" element={<AdminProducts />} />
              <Route path="produtos/:productId" element={<AdminProductForm />} />
              <Route path="categorias" element={<AdminCategories />} />
              <Route path="frete" element={<AdminShipping />} />
              <Route path="devolucoes" element={<AdminReturns />} />
              <Route path="pedidos" element={<AdminOrders />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
