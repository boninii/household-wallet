'use client'

import { useMemo } from 'react'

import type {
  CategoryWithPct,
  Expense,
  MonthlyBudget
} from '@/lib/types'

import { getProgressColor } from '@/lib/types'

import { cn } from '@/lib/utils'

import { Amount } from '@/components/shell/amount'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { ExpenseRow } from './expense-row'

import { AddExpenseForm } from './add-expense-form'

type Props = {

  category: CategoryWithPct

  budget: MonthlyBudget

  expenses: Expense[]

  on_added: (e: Expense) => void

  on_updated: (e: Expense) => void

  on_deleted: (id: string) => void

}

export function CategoryPanel({
  category,
  budget,
  expenses,
  on_added,
  on_updated,
  on_deleted
}: Props) {

  const pct = Number(category.pct || 0)

  const planned = (Number(budget.income || 0) * pct) / 100

  const spent = useMemo(
    () => expenses.reduce((acc, e) => acc + Number(e.value || 0), 0),
    [expenses]

  )

  const remaining = planned - spent

  const used_pct = planned > 0 ? (spent / planned) * 100 : 0

  const used_color = getProgressColor(used_pct, category.is_saving)

  return (
    <div className='flex flex-col gap-6'>

      {/* RESUMO HORIZONTAL — banner no topo (mesmo padrão do Todos) */}

      <Card>

        <CardHeader>

          <div className='flex items-center gap-2'>

            <span
              className='inline-block h-3 w-3 rounded-full'
              style={{ background: category.color }}
            />

            <CardTitle>{category.label}</CardTitle>

          </div>

          <span className='text-xs text-text-300'>
            {expenses.length} item(s)
          </span>

        </CardHeader>

        <div className='grid gap-4 sm:grid-cols-3'>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              {category.is_saving ? 'Total investido' : 'Total gastos'}
            </p>
            <p
              className={cn(
                'mt-1 text-2xl font-semibold',
                category.is_saving ? 'text-positive-soft' : 'text-negative-soft'

              )}
            >
              <Amount brl={spent} />
            </p>
          </div>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Meta
            </p>
            <p className='mt-1 text-2xl font-semibold text-text-50'>
              <Amount brl={planned} />
            </p>
            <p className='text-sm text-text-300'>
              {pct.toFixed(0)}% da renda
            </p>
          </div>

          <div>
            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Utilizado
            </p>
            <p className={cn('mt-1 text-2xl font-semibold', used_color)}>
              <Amount brl={spent} />
            </p>
            <p className={cn('text-sm font-medium', used_color)}>
              {used_pct.toFixed(0)}%
              {used_pct > 100
                ? ` da meta (+${Math.round(used_pct - 100)}%)`
                : ' da meta'}
            </p>
          </div>

        </div>

      </Card>

      {/* LISTA (55%) + FORM STICKY (45%) */}

      <div className='grid gap-6 lg:grid-cols-[55fr_45fr]'>

        <Card className='self-start'>

          <CardHeader>

            <CardTitle>Lançamentos</CardTitle>

            <span className='text-xs text-text-300'>
              {expenses.length} item(s)
            </span>

          </CardHeader>

          <div className='overflow-hidden rounded-lg border border-bg-700/50'>

            <div className='grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider text-text-300 bg-bg-900/40'>

              <span>Custo</span>

              <span className='text-right'>Valor</span>

              <span aria-hidden />

              <span aria-hidden />

              <span aria-hidden />

            </div>

            {expenses.length === 0 ? (

              <p className='px-4 py-10 text-center text-sm text-text-300'>
                Nenhum custo nesta categoria neste mês.
              </p>

            ) : (

              <ul className='divide-y divide-dashed divide-bg-700/40'>

                {expenses.map((e) => (

                  <ExpenseRow
                    key={e.id}
                    expense={e}
                    on_updated={on_updated}
                    on_deleted={on_deleted}
                  />

                ))}

              </ul>

            )}

          </div>

        </Card>

        <aside className='lg:sticky lg:top-8 lg:self-start'>

          <Card>

            <AddExpenseForm
              budget_id={budget.id}
              current_month={budget.month}
              current_year={budget.year}
              category_slug={category.slug}
              category_label={category.label}
              category_color={category.color}
              on_added={on_added}
            />

          </Card>

        </aside>

      </div>

    </div>

  )

}
