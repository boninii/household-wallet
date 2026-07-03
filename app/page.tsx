import {
  getBudgetAllocations,
  getOrCreateBudget,
  listExpenses
} from '@/app/actions/budget'

import { listCategories } from '@/app/actions/categories'

import { ResumoPage } from '@/components/budget/resumo-page'

import { MigrationBanner } from '@/components/shell/migration-banner'

import { PageHeader } from '@/components/budget/page-header'

import { readMigrationSQL } from '@/lib/migration'

export const dynamic = 'force-dynamic'

type PageProps = {

  searchParams: { month?: string; year?: string }

}

export default async function Page({ searchParams }: PageProps) {

  const now = new Date()

  const month = Number(searchParams.month) || now.getMonth() + 1

  const year = Number(searchParams.year) || now.getFullYear()

  // dispara categorias e orçamento em paralelo (independentes entre si)
  const cats_promise = listCategories({ include_archived: true })

  const budget_promise = getOrCreateBudget(month, year).catch(() => null)

  const cats = await cats_promise

  const budget = await budget_promise

  if (!cats.ready || !budget) {

    return (
      <section className='flex flex-col gap-8'>

        <PageHeader
          title='Dashboard'
          subtitle='Visão consolidada do mês.'
        />

        <MigrationBanner
          title='Faltam tabelas no banco'
          description='O Dashboard usa categorias dinâmicas. Rode a migration v2:'
          sql_content={readMigrationSQL()}
          supabase_url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
        />

      </section>

    )

  }

  const [expenses, allocations] = await Promise.all([
    listExpenses(budget.id),
    getBudgetAllocations(budget.id)

  ])

  return (
    <ResumoPage
      budget={budget}
      expenses={expenses}
      categories={cats.items}
      allocations={allocations}
    />

  )

}
