'use client'

import { useTransition } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { monthLabel, shiftMonth } from '@/lib/utils'

type Props = {

  month: number

  year: number

}

export function MonthSelector({ month, year }: Props) {

  const router = useRouter()

  const pathname = usePathname()

  const params = useSearchParams()

  const [pending, startTransition] = useTransition()

  function jump(delta: number) {

    const next = shiftMonth(month, year, delta)

    const next_params = new URLSearchParams(params.toString())

    next_params.set('month', String(next.month))

    next_params.set('year', String(next.year))

    startTransition(() => {

      router.push(`${pathname}?${next_params.toString()}`)

    })

  }

  return (
    <div className='flex flex-col gap-1.5'>

      <span className='font-sans text-[11px] font-semibold uppercase tracking-wider text-brand'>
        Mês de referência
      </span>

      <div className='flex items-center gap-1 rounded-xl bg-brand p-1 shadow-card'>

        <button
          aria-label='Mês anterior'
          onClick={() => jump(-1)}
          disabled={pending}
          className='flex h-8 w-8 items-center justify-center rounded-lg text-bg-900 hover:bg-bg-900/10 disabled:opacity-50'
        >
          <ChevronLeft className='h-4 w-4' />
        </button>

        <span className='min-w-[140px] px-3 text-center font-sans text-sm font-semibold text-bg-900'>

          {pending ? (

            <Loader2 className='inline h-4 w-4 animate-spin' />

          ) : (

            monthLabel(month, year)

          )}

        </span>

        <button
          aria-label='Próximo mês'
          onClick={() => jump(1)}
          disabled={pending}
          className='flex h-8 w-8 items-center justify-center rounded-lg text-bg-900 hover:bg-bg-900/10 disabled:opacity-50'
        >
          <ChevronRight className='h-4 w-4' />
        </button>

      </div>

    </div>

  )

}
