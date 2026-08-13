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

      {/* pb no mobile abre espaço pro dock inferior; pl no desktop abre
          espaço pra sidebar flutuante (84px + margens). */}
      <main className='min-h-screen px-4 pb-28 pt-6 sm:px-6 md:py-8 md:pl-[124px] md:pr-8 lg:pl-[132px] lg:pr-12 lg:py-10'>

        <div className='mx-auto w-full max-w-[1480px]'>{children}</div>

      </main>

    </>

  )

}
