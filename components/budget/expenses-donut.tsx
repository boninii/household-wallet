'use client'

import { useMemo } from 'react'

import { Donut } from '@/components/ui/donut'

import type { CategoryWithPct } from '@/lib/types'

import { formatBRL } from '@/lib/utils'

import { usePrivacy } from '@/components/shell/privacy-provider'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {

  categories: CategoryWithPct[]

  totals: Record<string, number>

}

export function ExpensesDonut({ categories, totals }: Props) {

  const { hidden, mask_brl } = usePrivacy()

  const format = (v: number) => (hidden ? mask_brl : formatBRL(v))

  const data = useMemo(() => {

    return categories.map((c) => ({
      name: c.label,
      value: totals[c.slug] ?? 0,
      color: c.color

    }))
  }, [totals, categories])

  const grand_total = data.reduce((acc, d) => acc + d.value, 0)

  const has_data = grand_total > 0

  return (
    <Card className='flex flex-col'>

      <CardHeader>
        <CardTitle>Distribuição real</CardTitle>
      </CardHeader>

      <div className='flex flex-1 flex-col items-center justify-between gap-5'>

        <div className='h-[220px] w-full'>

          {has_data ? (

            <Donut data={data} inner_radius={62} outer_radius={96} format={format} />

          ) : (

            <div className='flex h-full items-center justify-center text-center text-sm text-text-300'>
              Você ainda não possui gastos cadastrados.
            </div>

          )}

        </div>

        <p className='text-base font-semibold text-text-50'>Total {format(grand_total)}</p>

        <ul className='grid w-full grid-cols-2 gap-x-3 gap-y-2 text-[12px] text-text-100'>

          {data.map((d) => (

            <li key={d.name} className='flex items-center gap-2'>

              <span
                className='h-2.5 w-2.5 rounded-full'
                style={{ background: d.color }}
              />

              <span className='truncate'>{d.name}</span>

            </li>

          ))}

        </ul>

      </div>

    </Card>

  )

}
