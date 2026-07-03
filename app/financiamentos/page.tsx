import { listFinancings } from '@/app/actions/financing'

import { listCategories } from '@/app/actions/categories'

import { FinancingsManager } from '@/components/financing/financings-manager'

import { MigrationBanner } from '@/components/shell/migration-banner'

import { PageHeader } from '@/components/budget/page-header'

import { readMigrationSQL } from '@/lib/migration'

export const dynamic = 'force-dynamic'

export default async function Page() {

  const [cats, fins] = await Promise.all([
    listCategories(),
    listFinancings()

  ])

  if (!cats.ready || !fins.ready) {

    return (
      <section className='flex flex-col gap-8'>

        <PageHeader
          title='Financiamentos'
          subtitle='Cadastre parcelados de longo prazo e marque cada parcela paga.'
        />

        <MigrationBanner
          title='Faltam tabelas no banco'
          sql_content={readMigrationSQL()}
          supabase_url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
        />

      </section>

    )

  }

  return <FinancingsManager items={fins.items} categories={cats.items} />

}
