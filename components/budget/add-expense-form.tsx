'use client'

import { useState, useTransition } from 'react'

import { Infinity, Loader2, Plus, Repeat } from 'lucide-react'

import {
  addExpense,
  addExpenseAndRecurring
} from '@/app/actions/budget'

import type { Expense } from '@/lib/types'

import { cn, parseBRL } from '@/lib/utils'

import { Button } from '@/components/ui/button'

import { Input, Label } from '@/components/ui/input'

import { MoneyInput } from '@/components/ui/money-input'

type Props = {

  budget_id: string

  current_month: number

  current_year: number

  category_slug: string

  category_label: string

  category_color: string

  on_added: (e: Expense) => void

}

type Mode = 'avulsa' | 'recorrente'

type Duration = 'indef' | 'parcels'

export function AddExpenseForm({
  budget_id,
  current_month,
  current_year,
  category_slug,
  category_label,
  category_color,
  on_added
}: Props) {

  const [mode, setMode] = useState<Mode>('avulsa')

  const [duration_mode, setDurationMode] = useState<Duration>('indef')

  const [parcels, setParcels] = useState<string>('12')

  const [name, setName] = useState('')

  const [value, setValue] = useState('')

  const [notes, setNotes] = useState('')

  const [show_notes_field, setShowNotesField] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function reset() {

    setName('')

    setValue('')

    setNotes('')

    setShowNotesField(false)

    setMode('avulsa')

    setDurationMode('indef')

    setParcels('12')

  }

  function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    setError(null)

    const numeric = parseBRL(value)

    if (!name.trim() || !(numeric > 0)) {

      setError('Preencha nome e valor.')

      return

    }

    startTransition(async () => {

      try {

        let new_expense

        if (mode === 'avulsa') {

          new_expense = await addExpense(
            budget_id,
            category_slug,
            name,
            numeric,
            notes || null,
            null

          )

        } else {

          const duration_months =
            duration_mode === 'parcels'
              ? Math.max(1, Number(parcels) || 0)
              : null

          new_expense = await addExpenseAndRecurring({
            budget_id,
            category: category_slug,
            name,
            value: numeric,
            notes,
            payment_method: null,
            duration_months,
            start_month: current_month,
            start_year: current_year

          })

        }

        on_added(new_expense)

        reset()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-4'
    >

      <div className='flex items-center gap-2'>

        <span
          className='h-2 w-2 rounded-full'
          style={{ background: category_color }}
        />

        <p className='text-sm font-semibold uppercase tracking-wider text-brand'>
          Adicionar em {category_label}
        </p>

      </div>

      {/* Tipo: avulsa vs recorrente */}

      <div className='inline-flex self-start rounded-xl bg-bg-900 p-1 ring-1 ring-bg-700'>

        <button
          type='button'
          onClick={() => setMode('avulsa')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            mode === 'avulsa'
              ? 'bg-brand text-bg-900'
              : 'text-text-300 hover:text-text-50'

          )}
        >
          <Plus className='h-3.5 w-3.5' />
          Avulsa
        </button>

        <button
          type='button'
          onClick={() => setMode('recorrente')}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            mode === 'recorrente'
              ? 'bg-brand text-bg-900'
              : 'text-text-300 hover:text-text-50'

          )}
        >
          <Repeat className='h-3.5 w-3.5' />
          Recorrente
        </button>

      </div>

      <div className='grid gap-3 md:grid-cols-2'>

        <div>
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder='Mercado, conta de luz...'
          />
        </div>

        <div>
          <Label>Valor</Label>
          <MoneyInput
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            placeholder='0,00'
          />
        </div>

      </div>

      {/* Bloco de recorrência aparece só se for recorrente */}

      {mode === 'recorrente' && (

        <div className='flex flex-col gap-2 rounded-xl border border-dashed border-brand/40 bg-bg-900/30 p-3 animate-in fade-in slide-in-from-top-2 duration-200'>

          <Label>Duração</Label>

          <div className='flex flex-wrap items-center gap-2'>

            <div className='inline-flex rounded-lg bg-bg-900 p-1 ring-1 ring-bg-700'>

              <button
                type='button'
                onClick={() => setDurationMode('indef')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                  duration_mode === 'indef'
                    ? 'bg-brand text-bg-900'
                    : 'text-text-300 hover:text-text-50'

                )}
              >
                <Infinity className='h-3 w-3' /> Indeterminado
              </button>

              <button
                type='button'
                onClick={() => setDurationMode('parcels')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                  duration_mode === 'parcels'
                    ? 'bg-brand text-bg-900'
                    : 'text-text-300 hover:text-text-50'

                )}
              >
                Parcelado
              </button>

            </div>

            {duration_mode === 'parcels' && (

              <div className='flex items-center gap-2'>

                <Input
                  type='number'
                  min={1}
                  value={parcels}
                  onChange={(e) => setParcels(e.target.value)}
                  className='w-20 h-8 text-xs'
                />

                <span className='text-[11px] text-text-300'>meses</span>

              </div>

            )}

          </div>

          <p className='text-[11px] text-text-300'>
            Vai começar no mês atual ({String(current_month).padStart(2, '0')}/{current_year})
            {duration_mode === 'indef'
              ? ' e repetir até você pausar.'
              : ` por ${parcels || 0} parcelas.`}
            {' '}
            Cada mês seguinte herda o valor anterior — você ajusta no autofill.
          </p>

        </div>

      )}

      {show_notes_field ? (

        <div>
          <Label>Nota</Label>
          <Input
            value={notes}
            onChange={(ev) => setNotes(ev.target.value)}
            placeholder='Ex: moto consertando, conta veio alta...'
          />
        </div>

      ) : (

        <button
          type='button'
          onClick={() => setShowNotesField(true)}
          className='self-start text-[11px] uppercase tracking-wider text-text-300 hover:text-brand transition'
        >
          + adicionar nota
        </button>

      )}

      <div className='flex items-center justify-between gap-3'>

        {error ? (
          <span className='text-xs text-negative-soft'>{error}</span>
        ) : (
          <span />

        )}

        <Button type='submit' variant='subtle' disabled={pending}>
          {pending ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : mode === 'recorrente' ? (
            <Repeat className='h-3.5 w-3.5' />
          ) : (
            <Plus className='h-3.5 w-3.5' />

          )}
          Adicionar
        </Button>

      </div>

    </form>

  )

}
