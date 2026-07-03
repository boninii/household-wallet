import { listInvestments } from '@/app/actions/investment'

import { getCachedUsdBrlRate } from '@/app/actions/fx'

import { InvestmentsManager } from '@/components/investing/investments-manager'

import { MigrationBanner } from '@/components/shell/migration-banner'

import { PageHeader } from '@/components/budget/page-header'

import { readMigrationSQL } from '@/lib/migration'

export const dynamic = 'force-dynamic'

export default async function Page() {

  // dispara investimentos e cotação em paralelo (independentes entre si)
  const investments_promise = listInvestments()

  const rate_promise = getCachedUsdBrlRate().catch(() => null)

  const { items, ready } = await investments_promise

  if (!ready) {

    return (
      <section className='flex flex-col gap-8'>

        <PageHeader
          title='Investimentos'
          subtitle='Catalogue suas posições por plataforma, tipo, moeda e vencimento.'
        />

        <MigrationBanner
          title='Tabela de investimentos ainda não criada'
          sql_content={readMigrationSQL()}
          supabase_url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
        />

      </section>

    )

  }

  const rate = await rate_promise

  return <InvestmentsManager items={items} usd_brl_rate={rate?.rate ?? null} />

}
