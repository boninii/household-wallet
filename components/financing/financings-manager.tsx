'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react'

import {
  createFinancing,
  deleteFinancing,
  payParcel,
  undoLastParcel
} from '@/app/actions/financing'

import type { Category, Financing } from '@/lib/types'

import { cn, formatBRL, parseBRL } from '@/lib/utils'

import { Amount } from '@/components/shell/amount'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { Input, Label } from '@/components/ui/input'

import { useConfirm } from '@/components/ui/confirm-provider'

import { PageHeader } from '@/components/budget/page-header'

type Props = {

  items: Financing[]

  categories: Category[]

}

export function FinancingsManager({ items, categories }: Props) {

  const router = useRouter()

  const confirm = useConfirm()

  const now = new Date()

  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')

  const [category, setCategory] = useState<string>(categories[0]?.slug ?? 'custos_fixos')

  const [total, setTotal] = useState('')

  const [value, setValue] = useState('')

  const [rate, setRate] = useState('')

  const [downPayment, setDownPayment] = useState('')

  const [totalValue, setTotalValue] = useState('')

  const [startMonth, setStartMonth] = useState(now.getMonth() + 1)

  const [startYear, setStartYear] = useState(now.getFullYear())

  const [error, setError] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  const [paying_id, setPayingId] = useState<string | null>(null)

  const [pay_value, setPayValue] = useState('')

  function handleCreate(e: React.FormEvent) {

    e.preventDefault()

    setError(null)

    const total_parcels = Math.max(1, Number(total) || 0)

    const parcel_value = parseBRL(value)

    if (!name.trim() || total_parcels < 1 || !(parcel_value > 0)) {

      setError('Preencha nome, parcelas e valor da parcela.')

      return

    }

    const interest_rate = rate ? Number(rate.replace(',', '.')) : null

    startTransition(async () => {

      try {

        await createFinancing({
          name,
          category,
          total_parcels,
          parcel_value,
          start_month: startMonth,
          start_year: startYear,
          interest_rate,
          down_payment: parseBRL(downPayment) || 0,
          total_value: totalValue ? parseBRL(totalValue) : null

        })

        setName('')

        setTotal('')

        setValue('')

        setRate('')

        setDownPayment('')

        setTotalValue('')

        setOpen(false)

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  function openPay(f: Financing) {

    setPayingId(f.id)

    setPayValue(formatBRL(Number(f.parcel_value)))

    setError(null)

  }

  function closePay() {

    setPayingId(null)

    setPayValue('')

  }

  function confirmPay() {

    if (!paying_id) {

      return

    }

    const value = parseBRL(pay_value)

    if (!(value > 0)) {

      setError('Informe um valor válido para a parcela.')

      return

    }

    const today = new Date()

    const id = paying_id

    startTransition(async () => {

      try {

        await payParcel(id, today.getMonth() + 1, today.getFullYear(), value)

        closePay()

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  function handleUndo(id: string) {

    startTransition(async () => {

      await undoLastParcel(id)

      router.refresh()

    })

  }

  async function handleDelete(id: string) {

    const ok = await confirm({
      title: 'Excluir financiamento',
      description: 'O financiamento e todas as parcelas registradas serão removidos. Não dá para desfazer.',
      confirm_label: 'Excluir',
      danger: true

    })

    if (!ok) {

      return

    }

    startTransition(async () => {

      await deleteFinancing(id)

      router.refresh()

    })

  }

  const total_open_debt = items.reduce((acc, f) => {

    return acc + (f.total_parcels - f.paid_parcels) * Number(f.parcel_value)
  }, 0)

  const total_paid = items.reduce((acc, f) => {

    return acc + f.paid_parcels * Number(f.parcel_value)
  }, 0)

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Financiamentos'
        subtitle='Cadastre parcelados de longo prazo e marque cada parcela paga — vira despesa automática no mês corrente.'
        action={
          <Button onClick={() => setOpen((o) => !o)}>
            {open ? (
              <X className='h-3.5 w-3.5' />
            ) : (
              <Plus className='h-3.5 w-3.5' />

            )}
            {open ? 'Fechar' : 'Novo financiamento'}
          </Button>

        }
      />

      <div className='grid gap-4 sm:grid-cols-3'>

        <Card>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Em aberto
          </p>
          <p className='mt-1 text-3xl font-semibold text-negative-soft'>
            <Amount brl={total_open_debt} />
          </p>
        </Card>

        <Card>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Já pago
          </p>
          <p className='mt-1 text-3xl font-semibold text-positive-soft'>
            <Amount brl={total_paid} />
          </p>
        </Card>

        <Card>
          <p className='text-[11px] uppercase tracking-wider text-text-300'>
            Contratos ativos
          </p>
          <p className='mt-1 text-3xl font-semibold text-text-50'>
            {items.filter((f) => f.paid_parcels < f.total_parcels).length}
          </p>
        </Card>

      </div>

      {open && (

        <Card>

          <CardHeader>
            <CardTitle>Novo contrato</CardTitle>
          </CardHeader>

          <form onSubmit={handleCreate} className='flex flex-col gap-5'>

            <div>

              <Label>Categoria do gasto</Label>

              <div className='flex flex-wrap gap-2'>

                {categories.map((c) => (

                  <button
                    key={c.slug}
                    type='button'
                    onClick={() => setCategory(c.slug)}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ring-1',
                      category === c.slug
                        ? 'bg-brand text-bg-900 ring-brand'
                        : 'bg-bg-800 text-text-100 ring-bg-700 hover:bg-bg-700'

                    )}
                  >
                    <span
                      className='h-2 w-2 rounded-full'
                      style={{ background: c.color }}
                    />
                    {c.label}
                  </button>

                ))}

              </div>

            </div>

            <div className='grid gap-3 md:grid-cols-2'>

              <div>
                <Label>Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='Apartamento, carro, notebook...'
                />
              </div>

              <div>
                <Label>Quantidade de parcelas</Label>
                <Input
                  type='number'
                  min={1}
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder='60'
                />
              </div>

              <div>
                <Label>Valor base da parcela</Label>
                <Input
                  value={value}
                  inputMode='decimal'
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='R$ 0,00'
                />
                <p className='mt-1 text-[10px] text-text-300'>
                  Você pode ajustar o valor de cada parcela na hora de pagar.
                </p>
              </div>

              <div>
                <Label>Taxa (% a.m. opcional)</Label>
                <Input
                  value={rate}
                  inputMode='decimal'
                  onChange={(e) => setRate(e.target.value)}
                  placeholder='0,85'
                />
              </div>

              <div>
                <Label>Valor da entrada</Label>
                <Input
                  value={downPayment}
                  inputMode='decimal'
                  onChange={(e) => setDownPayment(e.target.value)}
                  placeholder='R$ 0,00'
                />
              </div>

              <div>
                <Label>Valor total financiado (opcional)</Label>
                <Input
                  value={totalValue}
                  inputMode='decimal'
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder='R$ 0,00'
                />
              </div>

              <div>
                <Label>Mês início</Label>
                <Input
                  type='number'
                  min={1}
                  max={12}
                  value={startMonth}
                  onChange={(e) => setStartMonth(Number(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label>Ano início</Label>
                <Input
                  type='number'
                  value={startYear}
                  onChange={(e) =>
                    setStartYear(Number(e.target.value) || now.getFullYear())

                  }
                />
              </div>

            </div>

            <div className='flex items-center justify-between gap-3 pt-2'>

              {error ? (
                <span className='text-xs text-negative-soft'>{error}</span>
              ) : (
                <span className='text-xs text-text-300'>
                  Cada parcela paga vira uma despesa no mês corrente da categoria escolhida.
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
          <CardTitle>Contratos</CardTitle>
        </CardHeader>

        {items.length === 0 ? (

          <p className='py-10 text-center text-sm text-text-300'>
            Nenhum financiamento cadastrado.
          </p>

        ) : (

          <ul className='flex flex-col gap-4'>

            {items.map((f) => {

              const remaining = f.total_parcels - f.paid_parcels

              const pct = (f.paid_parcels / f.total_parcels) * 100

              const meta = categories.find((c) => c.slug === f.category)

              const is_done = f.paid_parcels >= f.total_parcels

              return (
                <li
                  key={f.id}
                  className='flex flex-col gap-4 rounded-xl border border-bg-700/40 bg-bg-900/40 p-5'
                >

                  <div className='flex flex-wrap items-start justify-between gap-3'>

                    <div className='min-w-0'>

                      <p className='text-xl font-semibold text-text-50'>{f.name}</p>

                      <p className='mt-1 flex items-center gap-2 text-xs text-text-300'>
                        <span
                          className='h-2 w-2 rounded-full'
                          style={{ background: meta?.color }}
                        />
                        {meta?.label}

                        {f.interest_rate !== null && (
                          <span className='ml-2'>
                            • {Number(f.interest_rate).toFixed(2)}% a.m.
                          </span>

                        )}

                        <span className='ml-2'>
                          • desde {String(f.start_month).padStart(2, '0')}/{f.start_year}
                        </span>

                      </p>

                    </div>

                    <div className='text-right'>

                      <p className='text-2xl font-semibold text-text-50'>
                        <Amount brl={Number(f.parcel_value)} />
                      </p>

                      <p className='text-[11px] uppercase tracking-wider text-text-300'>
                        por parcela
                      </p>

                    </div>

                  </div>

                  <div>

                    <div className='flex items-center justify-between text-xs text-text-300'>
                      <span>{f.paid_parcels}/{f.total_parcels} parcelas pagas</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>

                    <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-800'>
                      <div
                        className='h-full rounded-full bg-brand transition-all'
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                  </div>

                  <div className='flex flex-wrap items-center justify-between gap-3'>

                    <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-text-300'>

                      <span>
                        Resta{' '}
                        <span className='font-semibold text-text-50'>
                          <Amount brl={remaining * Number(f.parcel_value)} />
                        </span>
                      </span>

                      <span>
                        {remaining} parcela{remaining === 1 ? '' : 's'} pendente{remaining === 1 ? '' : 's'}
                      </span>

                    </div>

                    <div className='flex items-center gap-2'>

                      {f.paid_parcels > 0 && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleUndo(f.id)}
                          disabled={pending}
                        >
                          <RotateCcw className='h-3.5 w-3.5' /> Desfazer
                        </Button>

                      )}

                      <Button
                        size='sm'
                        onClick={() => openPay(f)}
                        disabled={pending || is_done}
                      >
                        <CheckCircle2 className='h-3.5 w-3.5' />
                        {is_done ? 'Quitado' : 'Pagar próxima'}
                      </Button>

                      <button
                        onClick={() => handleDelete(f.id)}
                        className='text-text-300 hover:text-negative'
                        aria-label='Excluir'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>

                    </div>

                  </div>

                </li>

              )

            })}

          </ul>

        )}

      </Card>

      {paying_id && (

        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
          onClick={closePay}
        >

          <div
            className='w-full max-w-md rounded-2xl bg-bg-900 p-6 ring-1 ring-bg-700 shadow-card'
            onClick={(e) => e.stopPropagation()}
          >

            <p className='font-display text-xl text-text-50'>
              Pagar parcela
            </p>

            <p className='mt-1 text-sm text-text-300'>
              Ajuste o valor caso a parcela deste mês esteja diferente do valor base.
            </p>

            <div className='mt-4'>
              <Label>Valor a pagar</Label>
              <Input
                value={pay_value}
                inputMode='decimal'
                onChange={(e) => setPayValue(e.target.value)}
                placeholder='R$ 0,00'
                autoFocus
              />
            </div>

            {error && (
              <p className='mt-2 text-xs text-negative-soft'>{error}</p>

            )}

            <div className='mt-5 flex justify-end gap-2'>

              <Button variant='outline' size='sm' onClick={closePay}>
                Cancelar
              </Button>

              <Button size='sm' onClick={confirmPay} disabled={pending}>
                {pending && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
                Confirmar pagamento
              </Button>

            </div>

          </div>

        </div>

      )}

    </section>

  )

}
