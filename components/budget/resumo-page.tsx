'use client'

import { useMemo } from 'react'

import { mergeWithAllocations } from '@/lib/categories'

import type { Category, Expense, MonthlyBudget } from '@/lib/types'

import { MonthBar } from '@/components/shell/month-bar'

import { ExpensesDonut } from './expenses-donut'

import { BudgetSummary } from './budget-summary'

import { GoalsCard } from './goals-card'

import { PageHeader } from './page-header'

type Props = {

  budget: MonthlyBudget

  expenses: Expense[]

  categories: Category[]

  allocations: Record<string, number>

}

export function ResumoPage({ budget, expenses, categories, allocations }: Props) {

  const cats_with_pct = useMemo(() => {

    return mergeWithAllocations(categories, allocations)
      .filter((c) => !c.archived_at || c.pct > 0)
  }, [categories, allocations])

  const used_slugs = useMemo(() => {

    return Array.from(new Set(expenses.map((e) => e.category)))
  }, [expenses])

  const visible_cats = useMemo(() => {

    const list = [...cats_with_pct]

    for (const slug of used_slugs) {

      if (!list.find((c) => c.slug === slug)) {

        const orphan = categories.find((c) => c.slug === slug)

        if (orphan) {

          list.push({ ...orphan, pct: 0 })

        }

      }

    }

    return list
  }, [cats_with_pct, used_slugs, categories])

  const totals_by_slug = useMemo(() => {

    const map: Record<string, number> = {}

    for (const c of visible_cats) {

      map[c.slug] = 0

    }

    for (const e of expenses) {

      map[e.category] = (map[e.category] ?? 0) + Number(e.value || 0)

    }

    return map
  }, [expenses, visible_cats])

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Dashboard'
        subtitle='Visão consolidada do mês — renda, gastos por categoria e meta para cada bucket.'
      />

      <MonthBar
        budget_id={budget.id}
        month={budget.month}
        year={budget.year}
        income={Number(budget.income)}
      />

      <div className='grid gap-6 xl:grid-cols-[1fr_1.4fr_0.9fr]'>

        <ExpensesDonut categories={visible_cats} totals={totals_by_slug} />

        <BudgetSummary
          budget={budget}
          categories={visible_cats}
          totals={totals_by_slug}
        />

        <GoalsCard categories={visible_cats} />

      </div>

    </section>

  )

}
