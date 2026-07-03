'use client'

import { useMemo, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { Loader2, Plus, Trash2, X } from 'lucide-react'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import {
  createInvestment,
  deleteInvestment
} from '@/app/actions/investment'

import type {
  Investment,
  InvestmentCurrency,
  InvestmentKind
} from '@/lib/types'

import { RATE_TYPES, formatRate } from '@/lib/types'

import { cn, formatBRL, parseBRL } from '@/lib/utils'

import { usePrivacy } from '@/components/shell/privacy-provider'

import { useConfirm } from '@/components/ui/confirm-provider'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { Input, Label } from '@/components/ui/input'

import { PageHeader } from '@/components/budget/page-header'

const KINDS: Array<{ key: InvestmentKind; label: string; color: string }> = [

  { key: 'renda_fixa', label: 'Renda fixa', color: '#22D3EE' },

  { key: 'renda_variavel', label: 'Renda variável', color: '#EC4899' },

  { key: 'fundos', label: 'Fundos', color: '#FACC15' },

  { key: 'cripto', label: 'Cripto', color: '#F97316' },

  { key: 'internacional', label: 'Internacional', color: '#6366F1' },

  { key: 'outros', label: 'Outros', color: '#A78BFA' }

]

const SUBTYPE_SUGGESTIONS: Record<InvestmentKind, string[]> = {

  renda_fixa: ['CDB', 'LCI', 'LCA', 'Tesouro Selic', 'Tesouro IPCA', 'Tesouro Pré', 'Debênture', 'CRA', 'CRI'],

  renda_variavel: ['Ações', 'BDR', 'ETF', 'FII', 'Opções'],

  fundos: ['Multimercado', 'Ações', 'Imobiliário', 'Cambial'],

  cripto: ['BTC', 'ETH', 'Stablecoin', 'Altcoin'],

  internacional: ['Stocks', 'ETF', 'REIT', 'Bonds'],

  outros: []

}

// Formata 'YYYY-MM-DD' como dd/mm/aaaa sem passar por Date (evita shift de fuso).
function formatDateBR(iso: string | null): string {

  if (!iso) {

    return '—'

  }

  const [y, m, d] = iso.slice(0, 10).split('-')

  return `${d}/${m}/${y}`

}

type Props = {

  items: Investment[]

  usd_brl_rate: number | null

}

export function InvestmentsManager({ items, usd_brl_rate }: Props) {

  const router = useRouter()

  const { hidden, mask_brl, mask_usd } = usePrivacy()

  const confirm = useConfirm()

  const rate = usd_brl_rate

  const format = (v: number) => (hidden ? mask_brl : formatBRL(v))

  const [open, setOpen] = useState(false)

  const [platform, setPlatform] = useState('')

  const [kind, setKind] = useState<InvestmentKind>('renda_fixa')

  const [subtype, setSubtype] = useState('')

  const [currency, setCurrencyVal] = useState<InvestmentCurrency>('BRL')

  const [value, setValue] = useState('')

  const [interest, setInterest] = useState('')

  const [rate_type, setRateType] = useState<string>('cdi')

  const [purchase, setPurchase] = useState(() =>
    new Date().toISOString().slice(0, 10)

  )

  const [maturity, setMaturity] = useState('')

  const [notes, setNotes] = useState('')

  const [error, setError] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent) {

    e.preventDefault()

    setError(null)

    const numeric = parseBRL(value)

    if (!platform.trim() || !(numeric > 0)) {

      setError('Preencha plataforma e valor.')

      return

    }

    startTransition(async () => {

      try {

        await createInvestment({
          platform,
          kind,
          subtype: subtype || null,
          currency,
          value: numeric,
          rate: interest ? Number(interest.replace(',', '.')) : null,
          rate_type: interest ? rate_type : null,
          purchase_date: purchase || null,
          maturity_date: maturity || null,
          notes

        })

        setPlatform('')

        setSubtype('')

        setValue('')

        setInterest('')

        setPurchase(new Date().toISOString().slice(0, 10))

        setMaturity('')

        setNotes('')

        setOpen(false)

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  async function handleDelete(id: string) {

    const ok = await confirm({
      title: 'Excluir investimento',
      description: 'Essa posição será removida da sua carteira. Não dá para desfazer.',
      confirm_label: 'Excluir',
      danger: true

    })

    if (!ok) {

      return

    }

    startTransition(async () => {

      await deleteInvestment(id)

      router.refresh()

    })

  }

  // converte tudo pra BRL para somar e depois deixa o currency context formatar
  const totals = useMemo(() => {

    const by_kind = new Map<InvestmentKind, number>()

    const platforms = new Set<string>()

    let grand_brl = 0

    for (const inv of items) {

      const value_brl =
        inv.currency === 'USD' && rate ? Number(inv.value) * rate : Number(inv.value)

      grand_brl += value_brl

      by_kind.set(inv.kind, (by_kind.get(inv.kind) ?? 0) + value_brl)

      platforms.add(inv.platform)

    }

    return { grand_brl, by_kind, platform_count: platforms.size }
  }, [items, rate])

  // fatias do grafico de divisao, ja na ordem de KINDS e sem tipos zerados
  const chart_data = useMemo(() => {

    return KINDS
      .map((k) => ({
        name: k.label,
        value: totals.by_kind.get(k.key) ?? 0,
        color: k.color

      }))
      .filter((d) => d.value > 0)

  }, [totals])

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Investimentos'
        subtitle='Catalogue suas posições por plataforma, tipo, moeda e vencimento. Suporta BRL e USD na mesma carteira.'
        action={
          <Button onClick={() => setOpen((o) => !o)}>
            {open ? (
              <X className='h-3.5 w-3.5' />
            ) : (
              <Plus className='h-3.5 w-3.5' />

            )}
            {open ? 'Fechar' : 'Novo investimento'}
          </Button>

        }
      />

      <div className='grid gap-4 lg:grid-cols-[0.85fr_1.15fr]'>

        <Card className='flex flex-col justify-center'>

          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Patrimônio total investido
          </p>

          <p className='mt-1 text-4xl font-semibold text-text-50'>
            {format(totals.grand_brl)}
          </p>

          <p className='mt-3 text-xs text-text-300'>
            {items.length} {items.length === 1 ? 'posição' : 'posições'}
            {' · '}
            {totals.platform_count}{' '}
            {totals.platform_count === 1 ? 'plataforma' : 'plataformas'}
          </p>

        </Card>

        <Card className='flex flex-col'>

          <CardHeader>
            <CardTitle>Divisão por tipo</CardTitle>
          </CardHeader>

          {chart_data.length === 0 ? (

            <p className='flex flex-1 items-center justify-center py-8 text-center text-sm text-text-300'>
              Cadastre investimentos para ver a divisão.
            </p>

          ) : (

            <div className='flex flex-col items-center gap-5 sm:flex-row'>

              <div className='h-[170px] w-full shrink-0 sm:w-[170px]'>

                <ResponsiveContainer>

                  <PieChart>

                    <Pie
                      data={chart_data}
                      dataKey='value'
                      nameKey='name'
                      innerRadius={50}
                      outerRadius={82}
                      stroke='none'
                      paddingAngle={1.5}
                    >
                      {chart_data.map((d, i) => (
                        <Cell key={i} fill={d.color} />

                      ))}
                    </Pie>

                    <Tooltip
                      cursor={false}
                      contentStyle={{
                        background: '#1F2937',
                        border: '1px solid #4B5563',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#F3F4F6'

                      }}
                      itemStyle={{ color: '#F3F4F6' }}
                      labelStyle={{ color: '#F3F4F6' }}
                      formatter={(v: number) => format(v)}
                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              <ul className='flex w-full flex-col gap-2 text-[12px]'>

                {chart_data.map((d) => {

                  const pct =
                    totals.grand_brl > 0 ? (d.value / totals.grand_brl) * 100 : 0

                  return (
                    <li key={d.name} className='flex items-center gap-2'>

                      <span
                        className='h-2.5 w-2.5 shrink-0 rounded-full'
                        style={{ background: d.color }}
                      />

                      <span className='flex-1 truncate text-text-100'>{d.name}</span>

                      <span className='font-medium text-text-50'>{format(d.value)}</span>

                      <span className='w-10 text-right text-text-300'>
                        {pct.toFixed(0)}%
                      </span>

                    </li>

                  )

                })}

              </ul>

            </div>

          )}

        </Card>

      </div>

      {open && (

        <Card>

          <CardHeader>
            <CardTitle>Novo investimento</CardTitle>
          </CardHeader>

          <form onSubmit={handleCreate} className='flex flex-col gap-5'>

            <div>

              <Label>Tipo</Label>

              <div className='flex flex-wrap gap-2'>

                {KINDS.map((k) => (

                  <button
                    key={k.key}
                    type='button'
                    onClick={() => {
                      setKind(k.key)
                      setSubtype('')

                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1',
                      kind === k.key
                        ? 'bg-brand text-bg-900 ring-brand'
                        : 'bg-bg-800 text-text-100 ring-bg-700 hover:bg-bg-700'

                    )}
                  >
                    <span
                      className='h-2 w-2 rounded-full'
                      style={{ background: k.color }}
                    />
                    {k.label}
                  </button>

                ))}

              </div>

            </div>

            <div className='grid gap-3 md:grid-cols-2'>

              <div>
                <Label>Plataforma</Label>
                <Input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder='XP, NuInvest, Binance, IBKR...'
                />
              </div>

              <div>
                <Label>Subtipo</Label>
                <Input
                  value={subtype}
                  onChange={(e) => setSubtype(e.target.value)}
                  placeholder={SUBTYPE_SUGGESTIONS[kind][0] ?? 'Detalhe opcional'}
                  list={`subtypes-${kind}`}
                />
                <datalist id={`subtypes-${kind}`}>
                  {SUBTYPE_SUGGESTIONS[kind].map((s) => (
                    <option key={s} value={s} />

                  ))}
                </datalist>
              </div>

              <div>

                <Label>Moeda</Label>

                <div className='inline-flex rounded-xl bg-bg-900 p-1 ring-1 ring-bg-700'>

                  <button
                    type='button'
                    onClick={() => setCurrencyVal('BRL')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      currency === 'BRL'
                        ? 'bg-brand text-bg-900'
                        : 'text-text-300 hover:text-text-50'

                    )}
                  >
                    🇧🇷 BRL
                  </button>

                  <button
                    type='button'
                    onClick={() => setCurrencyVal('USD')}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                      currency === 'USD'
                        ? 'bg-brand text-bg-900'
                        : 'text-text-300 hover:text-text-50'

                    )}
                  >
                    🇺🇸 USD
                  </button>

                </div>

              </div>

              <div>
                <Label>Valor aplicado</Label>
                <Input
                  value={value}
                  inputMode='decimal'
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={currency === 'USD' ? 'US$ 0,00' : 'R$ 0,00'}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>Taxa / rendimento (opcional)</Label>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-stretch'>
                  <Input
                    value={interest}
                    inputMode='decimal'
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder='100 (= 100% CDI), 12,5 (% a.a.), etc.'
                    className='sm:w-48'
                  />
                  <div className='flex flex-wrap items-center gap-1.5'>
                    {RATE_TYPES.map((t) => (
                      <button
                        key={t.key}
                        type='button'
                        onClick={() => setRateType(t.key)}
                        disabled={!interest}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-xs ring-1 transition',
                          rate_type === t.key
                            ? 'bg-brand text-bg-900 ring-brand'
                            : 'bg-bg-800 text-text-100 ring-bg-700 hover:bg-bg-700',
                          !interest && 'opacity-40 cursor-not-allowed'

                        )}
                      >
                        {t.label}
                      </button>

                    ))}
                  </div>
                </div>
                {interest && (
                  <p className='mt-1.5 text-[11px] text-text-300'>
                    Vai aparecer como{' '}
                    <span className='font-semibold text-text-50'>
                      {formatRate(Number(interest.replace(',', '.')), rate_type)}
                    </span>
                  </p>

                )}
              </div>

              <div>
                <Label>Data da aplicação</Label>
                <Input
                  type='date'
                  value={purchase}
                  onChange={(e) => setPurchase(e.target.value)}
                />
              </div>

              <div>
                <Label>Vencimento</Label>
                <Input
                  type='date'
                  value={maturity}
                  onChange={(e) => setMaturity(e.target.value)}
                />
              </div>

              <div className='md:col-span-2'>
                <Label>Notas</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Anotacoes livres'
                />
              </div>

            </div>

            <div className='flex items-center justify-between gap-3 pt-2'>

              {error ? (
                <span className='text-xs text-negative-soft'>{error}</span>
              ) : (
                <span className='text-xs text-text-300'>
                  Valores em USD usam a cotação atual para somar no patrimonio total.
                </span>

              )}

              <Button type='submit' disabled={pending}>
                {pending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Plus className='h-3.5 w-3.5' />

                )}
                Salvar
              </Button>

            </div>

          </form>

        </Card>

      )}

      <Card>

        <CardHeader>
          <CardTitle>Posições</CardTitle>
          <span className='text-xs text-text-300'>{items.length} item(s)</span>
        </CardHeader>

        {items.length === 0 ? (

          <p className='py-10 text-center text-sm text-text-300'>
            Nenhum investimento cadastrado.
          </p>

        ) : (

          <div className='overflow-x-auto'>

            <table className='w-full text-sm'>

              <thead>
                <tr className='text-left text-[11px] uppercase tracking-wider text-text-300'>
                  <th className='pb-3 font-medium'>Tipo</th>
                  <th className='pb-3 font-medium'>Plataforma</th>
                  <th className='pb-3 font-medium'>Subtipo</th>
                  <th className='pb-3 font-medium'>Moeda</th>
                  <th className='pb-3 font-medium'>Valor</th>
                  <th className='pb-3 font-medium'>Taxa</th>
                  <th className='pb-3 font-medium'>Aplicado em</th>
                  <th className='pb-3 font-medium'>Vencimento</th>
                  <th className='pb-3 text-right font-medium'>—</th>
                </tr>
              </thead>

              <tbody className='divide-y divide-dashed divide-bg-700/40'>

                {items.map((inv) => {

                  const k = KINDS.find((x) => x.key === inv.kind)

                  const value_brl =
                    inv.currency === 'USD' && rate
                      ? Number(inv.value) * rate
                      : Number(inv.value)

                  const formatted_native = hidden
                    ? (inv.currency === 'USD' ? mask_usd : mask_brl)
                    : new Intl.NumberFormat(
                        inv.currency === 'USD' ? 'en-US' : 'pt-BR',
                        { style: 'currency', currency: inv.currency }
                      ).format(Number(inv.value))

                  return (
                    <tr key={inv.id}>

                      <td className='py-3'>
                        <span className='inline-flex items-center gap-2 rounded-full bg-bg-800 px-2 py-1 text-[11px] text-text-100'>
                          <span
                            className='h-2 w-2 rounded-full'
                            style={{ background: k?.color }}
                          />
                          {k?.label}
                        </span>
                      </td>

                      <td className='py-3 text-text-50'>{inv.platform}</td>

                      <td className='py-3 text-text-100'>{inv.subtype || '—'}</td>

                      <td className='py-3 text-text-100'>{inv.currency}</td>

                      <td className='py-3'>
                        <p className='font-medium text-text-50'>{formatted_native}</p>
                        {inv.currency === 'USD' && (
                          <p className='text-[11px] text-text-300'>
                            {format(value_brl)} (BRL)
                          </p>

                        )}
                      </td>

                      <td className='py-3 text-text-100'>
                        {formatRate(inv.rate, inv.rate_type)}
                      </td>

                      <td className='py-3 text-text-100'>
                        {formatDateBR(inv.purchase_date)}
                      </td>

                      <td className='py-3 text-text-100'>
                        {formatDateBR(inv.maturity_date)}
                      </td>

                      <td className='py-3 text-right'>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className='text-text-300 hover:text-negative'
                          aria-label='Excluir'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </td>

                    </tr>

                  )

                })}

              </tbody>

            </table>

          </div>

        )}

      </Card>

    </section>

  )

}
