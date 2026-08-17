'use client'

import { useEffect, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { Wallet } from 'lucide-react'

import { getWalletState, switchWallet } from '@/app/actions/sharing'

import type { WalletChoice } from '@/app/actions/sharing'

import { cn } from '@/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

// So aparece quando a pessoa tem acesso a mais de uma carteira. Alterna a
// carteira ativa (cookie lido pelas server actions).

export function WalletSwitcher() {

  const router = useRouter()

  const [choices, setChoices] = useState<WalletChoice[]>([])

  const [active_id, setActiveId] = useState('')

  const [open, setOpen] = useState(false)

  const [pending, startTransition] = useTransition()

  useEffect(() => {

    getWalletState().then((s) => {

      setChoices(s.choices)

      setActiveId(s.active_id)

    })
  }, [])

  if (choices.length < 2) {

    return null

  }

  const active = choices.find((c) => c.owner_id === active_id) ?? choices[0]

  function pick(owner_id: string) {

    setOpen(false)

    setActiveId(owner_id)

    startTransition(async () => {

      await switchWallet(owner_id)

      router.refresh()

    })

  }

  return (
    <div className='relative'>

      <Tooltip>

        <TooltipTrigger asChild>

          <button
            type='button'
            onClick={() => setOpen((o) => !o)}
            disabled={pending}
            aria-label='Trocar de carteira'
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl transition',
              active.is_own
                ? 'text-text-300 hover:bg-bg-800 hover:text-text-50'
                : 'bg-brand/15 text-brand ring-1 ring-brand/40'

            )}
          >
            <Wallet className='h-5 w-5' />
          </button>

        </TooltipTrigger>

        <TooltipContent side='right'>{active.label}</TooltipContent>

      </Tooltip>

      {open && (

        <div className='absolute bottom-0 left-[52px] z-50 w-56 rounded-xl bg-bg-900 p-1.5 ring-1 ring-bg-700 shadow-card'>

          {choices.map((c) => (

            <button
              key={c.owner_id}
              type='button'
              onClick={() => pick(c.owner_id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                c.owner_id === active_id
                  ? 'bg-brand text-brand-ink'
                  : 'text-text-100 hover:bg-bg-800'

              )}
            >
              <Wallet className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{c.label}</span>
            </button>

          ))}

        </div>

      )}

    </div>

  )

}
