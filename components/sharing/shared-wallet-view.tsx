'use client'

import { useMemo } from 'react'

import { Eye } from 'lucide-react'

import { Donut } from '@/components/ui/donut'

import { formatRate } from '@/lib/types'

import { formatBRL, formatDateBR } from '@/lib/utils'

import { INVESTMENT_KIND_META as KIND_META } from '@/lib/investment-kinds'

// Visao publica (sem login) da carteira de investimentos. Somente leitura —
// os dados vem de uma RPC que valida token, revogacao e expiracao no banco.

type Item = {

  platform: string

  kind: string

  subtype: string | null

  currency: string

  value: number | string

  rate: number | null

  rate_type: string | null

  purchase_date: string | null

  maturity_date: string | null

}

type Props = {

  owner_name: string

  expires_at: string

  items: Item[]

}

export function SharedWalletView({ owner_name, expires_at, items }: Props) {

  // Sem cotacao no modo publico: soma apenas o que esta em BRL e informa
  // as posicoes em USD separadamente, para nao inventar conversao.
  const totals = useMemo(() => {

    const by_kind = new Map<string, number>()

    let brl = 0

    let usd = 0

    for (const it of items) {

      const v = Number(it.value)

      if (it.currency === 'USD') {

        usd += v

      } else {

        brl += v

        by_kind.set(it.kind, (by_kind.get(it.kind) ?? 0) + v)

      }

    }

    return { brl, usd, by_kind }
  }, [items])

  const chart_data = useMemo(() => {

    return Object.entries(KIND_META)
      .map(([key, meta]) => ({
        name: meta.label,
        value: totals.by_kind.get(key) ?? 0,
        color: meta.color

      }))
      .filter((d) => d.value > 0)
  }, [totals])

  const expires_label = expires_at
    ? new Date(expires_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'

      })
    : ''

  return (
    <main className='min-h-screen px-4 py-8 sm:px-6 lg:py-12'>

      <div className='mx-auto w-full max-w-4xl'>

        <header className='mb-8'>

          <span className='inline-flex items-center gap-1.5 rounded-full bg-bg-800 px-2.5 py-1 text-[11px] text-text-300'>
            <Eye className='h-3 w-3' />
            Somente leitura
          </span>

          <h1 className='mt-3 font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.015em] text-text-50 sm:text-[34px]'>
            Investimentos de {owner_name}
          </h1>

          {expires_label && (

            <p className='mt-2 text-sm text-text-300'>
              Este link expira em {expires_label}.
            </p>

          )}

        </header>

        {items.length === 0 ? (

          <div className='rounded-xl bg-bg-900 p-10 text-center text-sm text-text-300 ring-1 ring-bg-700/60'>
            Nenhum investimento cadastrado nesta carteira.
          </div>

        ) : (

          <div className='flex flex-col gap-6'>

            <div className='grid gap-4 sm:grid-cols-[0.9fr_1.1fr]'>

              <div className='rounded-xl bg-bg-900 p-5 ring-1 ring-bg-700/60 shadow-card'>

                <p className='text-[11px] uppercase tracking-wider text-text-300'>
                  Total em BRL
                </p>

                <p className='mt-1 text-3xl font-semibold tabular-nums text-text-50'>
                  {formatBRL(totals.brl)}
                </p>

                {totals.usd > 0 && (

                  <p className='mt-2 text-xs text-text-300'>
                    + {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'

                    }).format(totals.usd)} em posições internacionais
                  </p>

                )}

                <p className='mt-3 text-xs text-text-300'>
                  {items.length} {items.length === 1 ? 'posição' : 'posições'}
                </p>

              </div>

              {chart_data.length > 0 && (

                <div className='flex items-center gap-5 rounded-xl bg-bg-900 p-5 ring-1 ring-bg-700/60 shadow-card'>

                  <div className='h-[150px] w-[150px] shrink-0'>
                    <Donut data={chart_data} inner_radius={58} outer_radius={96} />
                  </div>

                  <ul className='flex flex-col gap-2 text-[12px]'>

                    {chart_data.map((d) => (

                      <li key={d.name} className='flex items-center gap-2'>

                        <span
                          className='h-2.5 w-2.5 shrink-0 rounded-full'
                          style={{ background: d.color }}
                        />

                        <span className='text-text-100'>{d.name}</span>

                      </li>

                    ))}

                  </ul>

                </div>

              )}

            </div>

            <div className='overflow-x-auto rounded-xl bg-bg-900 p-5 ring-1 ring-bg-700/60 shadow-card'>

              <table className='w-full text-sm'>

                <thead>
                  <tr className='text-left text-[11px] uppercase tracking-wider text-text-300'>
                    <th className='pb-3 font-medium'>Tipo</th>
                    <th className='pb-3 font-medium'>Plataforma</th>
                    <th className='pb-3 font-medium'>Subtipo</th>
                    <th className='pb-3 font-medium'>Valor</th>
                    <th className='pb-3 font-medium'>Taxa</th>
                    <th className='pb-3 font-medium'>Vencimento</th>
                  </tr>
                </thead>

                <tbody className='divide-y divide-dashed divide-bg-700/40'>

                  {items.map((it, i) => {

                    const meta = KIND_META[it.kind]

                    return (
                      <tr key={i}>

                        <td className='py-3'>
                          <span className='inline-flex items-center gap-2 rounded-full bg-bg-800 px-2 py-1 text-[11px] text-text-100'>
                            <span
                              className='h-2 w-2 rounded-full'
                              style={{ background: meta?.color }}
                            />
                            {meta?.label ?? it.kind}
                          </span>
                        </td>

                        <td className='py-3 text-text-50'>{it.platform}</td>

                        <td className='py-3 text-text-100'>{it.subtype || '—'}</td>

                        <td className='py-3 font-medium tabular-nums text-text-50'>
                          {new Intl.NumberFormat(
                            it.currency === 'USD' ? 'en-US' : 'pt-BR',
                            { style: 'currency', currency: it.currency }
                          ).format(Number(it.value))}
                        </td>

                        <td className='py-3 text-text-100'>
                          {formatRate(it.rate, it.rate_type)}
                        </td>

                        <td className='py-3 text-text-100'>
                          {formatDateBR(it.maturity_date)}
                        </td>

                      </tr>

                    )

                  })}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

    </main>

  )

}
