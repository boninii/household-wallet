'use client'

import { usePathname } from 'next/navigation'

import { Sidebar } from './sidebar'

// Decide o "chrome" da aplicacao: nas rotas de auth (ex: /login) renderiza a
// pagina limpa, sem sidebar. No resto, mostra a sidebar + o main com padding.

export function AppShell({ children }: { children: React.ReactNode }) {

  const path = usePathname()

  const is_auth = path.startsWith('/login')

  if (is_auth) {

    return <>{children}</>

  }

  return (
    <>

      <Sidebar />

      <main className='min-h-screen px-8 py-8 md:pl-[112px] md:pr-8 lg:pl-[120px] lg:pr-14 lg:py-10'>

        <div className='mx-auto w-full max-w-[1480px]'>{children}</div>

      </main>

    </>

  )

}
