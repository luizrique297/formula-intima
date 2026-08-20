import { Outlet } from 'react-router-dom'
import { AgeGate } from './AgeGate'

// Envolve só as rotas da área Sex Shop (/sex-shop e /sex-shop/produto/:slug).
// A área Lingerie não passa por aqui, então não exibe o aviso de 18+.
export function SexShopLayout() {
  return (
    <>
      <AgeGate />
      <Outlet />
    </>
  )
}
