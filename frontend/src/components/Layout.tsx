import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

// O aviso de 18+ não fica aqui: ele só é exibido dentro da área Sex Shop
// (ver SexShopLayout.tsx), já que a Lingerie é um catálogo comum, sem
// restrição de idade.
export function Layout() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
