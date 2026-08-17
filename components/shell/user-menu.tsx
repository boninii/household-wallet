'use client'

import { useEffect, useState, useTransition } from 'react'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

import { LogOut } from 'lucide-react'

import { cn } from '@/lib/utils'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

import { signOut } from '@/app/actions/auth'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

// Mostra a inicial do usuario logado e um botao de sair, no rodape da sidebar.
// Em `compact` (dock mobile) mostra apenas o botao de sair.

export function UserMenu({ compact }: { compact?: boolean }) {

  const path = usePathname()

  const [name, setName] = useState<string>('')

  const [pending, startTransition] = useTransition()

  useEffect(() => {

    const supabase = getSupabaseBrowser()

    supabase.auth.getUser().then(({ data }) => {

      const meta = data.user?.user_metadata as { full_name?: string } | undefined

      setName(meta?.full_name || data.user?.email || '')

    })

  }, [])

  const initial = name ? name.trim().charAt(0).toUpperCase() : '·'

  function handleLogout() {

    startTransition(() => {

      signOut()

    })

  }

  const logout_button = (
    <Tooltip>

      <TooltipTrigger asChild>

        <button
          type='button'
          onClick={handleLogout}
          disabled={pending}
          aria-label='Sair'
          className='flex h-9 w-9 items-center justify-center rounded-xl text-text-300 transition hover:bg-bg-800 hover:text-negative disabled:opacity-50'
        >
          <LogOut className='h-5 w-5' />
        </button>

      </TooltipTrigger>

      <TooltipContent side={compact ? 'top' : 'right'}>Sair</TooltipContent>

    </Tooltip>

  )

  if (compact) {

    return logout_button

  }

  return (
    <div className='flex flex-col items-center gap-3'>

      <Tooltip>

        <TooltipTrigger asChild>

          <Link
            href='/conta'
            prefetch={true}
            aria-label='Minha conta'
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-1 transition',
              path.startsWith('/conta')
                ? 'bg-brand text-brand-ink ring-brand'
                : 'bg-bg-800 text-text-100 ring-bg-700 hover:bg-bg-700 hover:text-text-50'

            )}
          >
            {initial}
          </Link>

        </TooltipTrigger>

        <TooltipContent side='right'>{name || 'Conta'}</TooltipContent>

      </Tooltip>

      {logout_button}

    </div>

  )

}
