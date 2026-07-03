'use client'

import type { CategoryWithPct, MonthlyBudget } from '@/lib/types'

import { getProgressColor } from '@/lib/types'

import { cn } from '@/lib/utils'

import { Amount } from '@/components/shell/amount'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {

  budget: MonthlyBudget

  categories: CategoryWithPct[]

  totals: Record<string, number>

}

export function BudgetSummary({ budget, categories, totals }: Props) {

  const income = Number(budget.income || 0)

  const rows = categories.map((c) => {

    const pct = Number(c.pct || 0)

    const planned = (income * pct) / 100

    const spent = totals[c.slug] ?? 0

    const remaining = planned - spent

    const used_pct = planned > 0 ? (spent / planned) * 100 : 0

    return { ...c, pct, planned, spent, remaining, used_pct }

  })

  const total_spent = rows.reduce((acc, r) => acc + r.spent, 0)

  const total_remaining = Math.max(0, income - total_spent)

  const total_used = income > 0 ? (total_spent / income) * 100 : 0

  return (
    <Card>

      <CardHeader>
        <CardTitle>Resumo do orçamento</CardTitle>
      </CardHeader>

      <div className='overflow-x-auto'>

        <table className='w-full text-sm'>

          <thead>

            <tr className='text-left text-[11px] uppercase tracking-wider text-text-300'>

              <th className='pb-3 font-medium'>Categoria</th>

              <th className='pb-3 font-medium'>Valor gasto</th>

              <th className='pb-3 font-medium'>Devo gastar</th>

              <th className='pb-3 font-medium'>Utilizado</th>

              <th className='pb-3 text-right font-medium'>Meta</th>

            </tr>

          </thead>

          <tbody className='divide-y divide-dashed divide-bg-700/40'>

            {rows.map((r) => {

              const used_color = getProgressColor(r.used_pct, r.is_saving)

              return (
                <tr key={r.id}>

                  <td className='py-3 font-medium text-text-50'>
                    <span className='flex items-center gap-2'>
                      <span
                        className='h-2 w-2 rounded-full'
                        style={{ background: r.color }}
                      />
                      {r.label}
                    </span>
                  </td>

                  <td className='py-3 text-text-100'>
                    <Amount brl={r.spent} />
                  </td>

                  <td className='py-3 text-text-100'>
                    <Amount brl={r.planned} />
                  </td>

                  <td className={cn('py-3 font-semibold', used_color)}>
                    {r.used_pct.toFixed(2)}%
                  </td>

                  <td className='py-3 text-right text-text-100'>
                    {r.pct.toFixed(2)}%
                  </td>

                </tr>

              )

            })}

          </tbody>

        </table>

      </div>

      <div className='mt-6 flex flex-wrap items-end gap-x-10 gap-y-4 border-t border-dashed border-bg-700/50 pt-5'>

        <div>
          <p className='text-3xl font-semibold text-negative-soft'>
            <Amount brl={total_spent} />
          </p>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Total gastos
          </p>
        </div>

        <div>
          <p className='text-3xl font-semibold text-text-50'>
            <Amount brl={total_remaining} />
          </p>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Disponível
          </p>
        </div>

        <div>
          <p className='text-3xl font-semibold text-text-50'>
            {total_used.toFixed(0)}%
          </p>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Utilizado
          </p>
        </div>

      </div>

    </Card>

  )

}
