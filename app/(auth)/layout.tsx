import { ThemeToggle } from '@/components/shell/theme-toggle'

// Layout compartilhado por /login e /register. Como as duas telas vivem no
// mesmo layout, alternar entre elas nao remonta o entorno — sem isso o
// ThemeToggle (que renderiza um placeholder ate montar) piscava a cada troca.
//
// O grupo (auth) nao aparece na URL: as rotas continuam /login e /register.

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <main className='relative flex min-h-screen items-center justify-center px-6 py-10'>

      <div className='absolute right-4 top-4'>
        <ThemeToggle />
      </div>

      <div className='w-full max-w-sm'>{children}</div>

    </main>

  )

}
