'use client'

import Link from 'next/link'

import type { CategoryWithPct } from '@/lib/types'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {

  categories: CategoryWithPct[]

}

export function GoalsCard({ categories }: Props) {

  return (
    <Card>

      <CardHeader>
        <CardTitle>Distribuição do mês</CardTitle>
      </CardHeader>

      <ul className='space-y-3'>

        {categories.map((c) => (

          <li
            key={c.id}
            className='flex items-center justify-between text-sm'
          >
            <span className='flex items-center gap-2 text-text-100'>
              <span
                className='h-2 w-2 rounded-full'
                style={{ background: c.color }}
              />
              {c.label}
            </span>

            <span className='font-semibold text-text-50'>
              {Number(c.pct).toFixed(0)}%
            </span>

          </li>

        ))}

      </ul>

      <div className='mt-6 flex justify-end'>

        <Button asChild variant='outline' size='sm'>
          <Link href='/categorias'>Editar categorias</Link>
        </Button>

      </div>

    </Card>

  )

}
