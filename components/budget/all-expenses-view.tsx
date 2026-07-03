'use client'

import { useMemo } from 'react'

import type {
  CategoryWithPct,
  Expense,
  MonthlyBudget
} from '@/lib/types'

import { cn } from '@/lib/utils'

import { Amount } from '@/components/shell/amount'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { ExpenseRow } from './expense-row'

type Props = {

  budget: MonthlyBudget

  categories: CategoryWithPct[]

  expenses: Expense[]

  on_updated: (e: Expense) => void

  on_deleted: (id: string) => void

}

export function AllExpensesView({
  budget,
  categories,
  expenses,
  on_updated,
  on_deleted
}: Props) {

  const grouped = useMemo(() => {

    const map = new Map<string, Expense[]>()

    for (const c of categories) {

      map.set(c.slug, [])

    }

    for (const e of expenses) {

      const arr = map.get(e.category)

      if (arr) {

        arr.push(e)

      } else {

        map.set(e.category, [e])

      }

    }

    return map

  }, [categories, expenses])

  const totals_by_slug = useMemo(() => {

    const map: Record<string, number> = {}

    for (const c of categories) {

      map[c.slug] = 0

    }

    for (const e of expenses) {

      map[e.category] = (map[e.category] ?? 0) + Number(e.value || 0)

    }

    return map

  }, [categories, expenses])

  const income = Number(budget.income || 0)

  const total_all = expenses.reduce((acc, e) => acc + Number(e.value || 0), 0)

  return (
    <div className='flex flex-col gap-6'>

      <Card>

        <CardHeader>

          <CardTitle>Resumo do mês</CardTitle>

          <span className='text-xs text-text-300'>{expenses.length} lançamento(s)</span>

        </CardHeader>

        <div className='grid gap-4 sm:grid-cols-3'>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Total gastos
            </p>
            <p className='mt-1 text-2xl font-semibold text-negative-soft'>
              <Amount brl={total_all} />
            </p>
          </div>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Renda
            </p>
            <p className='mt-1 text-2xl font-semibold text-positive-soft'>
              <Amount brl={income} />
            </p>
          </div>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Saldo
            </p>
            <p
              className={cn(
                'mt-1 text-2xl font-semibold',
                income - total_all >= 0
                  ? 'text-positive-soft'
                  : 'text-negative-soft'

              )}
            >
              <Amount brl={income - total_all} />
            </p>
          </div>

        </div>

      </Card>

      {categories.map((c) => {

        const items = grouped.get(c.slug) ?? []

        if (items.length === 0) {

          return null

        }

        const subtotal = totals_by_slug[c.slug] ?? 0

        return (
          <Card key={c.slug}>

            <CardHeader>

              <div className='flex items-center gap-2'>

                <span
                  className='h-3 w-3 rounded-full shrink-0'
                  style={{ background: c.color }}
                />

                <CardTitle>{c.label}</CardTitle>

              </div>

              <div className='text-right'>

                <p className='text-sm font-semibold text-text-50'>
                  <Amount brl={subtotal} />
                </p>

                <p className='text-[10px] uppercase tracking-wider text-text-300'>
                  {items.length} item(s)
                </p>

              </div>

            </CardHeader>

            <div className='overflow-hidden rounded-lg border border-bg-700/50'>

              <ul className='divide-y divide-dashed divide-bg-700/40'>

                {items.map((e) => (

                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    on_updated={on_updated}
                    on_deleted={on_deleted}
                  />

                ))}

              </ul>

            </div>

          </Card>

        )

      })}

      {expenses.length === 0 && (

        <Card>

          <p className='py-10 text-center text-sm text-text-300'>
            Nenhum gasto neste mês ainda. Escolha uma categoria acima e adicione.
          </p>

        </Card>

      )}

    </div>

  )

}
