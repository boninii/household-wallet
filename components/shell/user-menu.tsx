'use client'

import { useEffect, useState, useTransition } from 'react'

import { LogOut } from 'lucide-react'

import { getSupabaseBrowser } from '@/lib/supabase-browser'

import { signOut } from '@/app/actions/auth'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

// Mostra a inicial do usuario logado e um botao de sair, no rodape da sidebar.

export function UserMenu() {

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

  return (
    <div className='flex flex-col items-center gap-3'>

      <Tooltip>

        <TooltipTrigger asChild>

          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-bg-800 text-sm font-semibold text-text-100 ring-1 ring-bg-700'>
            {initial}
          </div>

        </TooltipTrigger>

        <TooltipContent side='right'>{name || 'Conta'}</TooltipContent>

      </Tooltip>

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

        <TooltipContent side='right'>Sair</TooltipContent>

      </Tooltip>

    </div>

  )

}
