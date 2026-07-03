'use client'

import { useCallback, useMemo, useState } from 'react'

import { Layers, LayoutGrid } from 'lucide-react'

import type {
  Category,
  Expense,
  MonthlyBudget
} from '@/lib/types'

import { mergeWithAllocations } from '@/lib/categories'

import { cn } from '@/lib/utils'

import { MonthBar } from '@/components/shell/month-bar'

import { CategoryPanel } from './category-panel'

import { AllExpensesView } from './all-expenses-view'

import { PageHeader } from './page-header'

const ALL_KEY = '_all'

type Props = {

  budget: MonthlyBudget

  expenses: Expense[]

  categories: Category[]

  allocations: Record<string, number>

  initial_category?: string

}

export function DespesasPage({
  budget,
  expenses: initial_expenses,
  categories,
  allocations,
  initial_category
}: Props) {

  // State LOCAL de despesas — atualizado optimistically pelos forms,
  // sem precisar de router.refresh() / reload de pagina.
  const [expenses, setExpenses] = useState<Expense[]>(initial_expenses)

  const handleAdded = useCallback((e: Expense) => {

    setExpenses((prev) => [...prev, e])

  }, [])

  const handleUpdated = useCallback((e: Expense) => {

    setExpenses((prev) => prev.map((x) => (x.id === e.id ? e : x)))

  }, [])

  const handleDeleted = useCallback((id: string) => {

    setExpenses((prev) => prev.filter((x) => x.id !== id))

  }, [])

  const cats_with_pct = useMemo(() => {

    return mergeWithAllocations(categories, allocations).filter(
      (c) => !c.archived_at

    )
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

  const default_slug =
    visible_cats.find((c) => c.slug === initial_category)?.slug ?? ALL_KEY

  const [active, setActive] = useState<string>(default_slug)

  const is_all = active === ALL_KEY

  const active_meta = is_all
    ? null
    : visible_cats.find((c) => c.slug === active) ?? visible_cats[0]

  const filtered = is_all
    ? expenses
    : expenses.filter((e) => e.category === active)

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Despesas do mês'
        subtitle='Veja todos os gastos do mês ou filtre por categoria. No "Adicionar" você marca se é avulso ou recorrente.'
      />

      <MonthBar
        budget_id={budget.id}
        month={budget.month}
        year={budget.year}
        income={Number(budget.income)}
      />

      <div className='flex flex-wrap items-center gap-2'>

        <button
          onClick={() => setActive(ALL_KEY)}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
            is_all
              ? 'bg-brand text-bg-900 shadow-card'
              : 'bg-bg-800 text-text-100 hover:bg-bg-700'

          )}
        >
          <LayoutGrid className='h-3.5 w-3.5' />
          Todos ({expenses.length})
        </button>

        <span className='mx-1 h-5 w-px bg-bg-700' aria-hidden />

        {visible_cats.map((c) => {

          const isActive = active === c.slug

          const count = expenses.filter((e) => e.category === c.slug).length

          return (
            <button
              key={c.id}
              onClick={() => setActive(c.slug)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
                isActive
                  ? 'bg-brand text-bg-900 shadow-card'
                  : 'bg-bg-800 text-text-100 hover:bg-bg-700'

              )}
            >
              <span
                className='h-2.5 w-2.5 rounded-full'
                style={{ background: c.color }}
              />
              {c.label}
              {count > 0 && (
                <span className='ml-1 text-[10px] opacity-70'>
                  {count}
                </span>

              )}
            </button>

          )

        })}

        {visible_cats.length === 0 && (

          <span className='inline-flex items-center gap-1.5 text-sm text-text-300'>
            <Layers className='h-4 w-4' />
            Nenhuma categoria ativa
          </span>

        )}

      </div>

      {is_all ? (

        <AllExpensesView
          budget={budget}
          categories={visible_cats}
          expenses={filtered}
          on_updated={handleUpdated}
          on_deleted={handleDeleted}
        />

      ) : active_meta ? (

        <CategoryPanel
          category={active_meta}
          budget={budget}
          expenses={filtered}
          on_added={handleAdded}
          on_updated={handleUpdated}
          on_deleted={handleDeleted}
        />

      ) : null}

    </section>

  )

}
