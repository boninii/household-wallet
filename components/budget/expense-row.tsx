'use client'

import { useState, useTransition } from 'react'

import {
  Check,
  Loader2,
  Pencil,
  Repeat,
  StickyNote,
  Trash2,
  X
} from 'lucide-react'

import { deleteExpense, updateExpense } from '@/app/actions/budget'

import type { Expense } from '@/lib/types'

import { cn, formatBRLPlain, parseBRL } from '@/lib/utils'

import { Amount } from '@/components/shell/amount'

import { Button } from '@/components/ui/button'

import { Input, Label } from '@/components/ui/input'

import { MoneyInput } from '@/components/ui/money-input'

type Props = {

  expense: Expense

  on_updated: (e: Expense) => void

  on_deleted: (id: string) => void

}

export function ExpenseRow({ expense, on_updated, on_deleted }: Props) {

  const [editing, setEditing] = useState(false)

  const [name, setName] = useState(expense.name)

  const [value, setValue] = useState(formatBRLPlain(Number(expense.value)))

  const [notes, setNotes] = useState(expense.notes ?? '')

  const [show_notes_view, setShowNotesView] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function startEdit() {

    setName(expense.name)

    setValue(formatBRLPlain(Number(expense.value)))

    setNotes(expense.notes ?? '')

    setError(null)

    setEditing(true)

  }

  function cancelEdit() {

    setEditing(false)

    setError(null)

  }

  function saveEdit() {

    setError(null)

    const numeric = parseBRL(value)

    if (!name.trim() || !(numeric >= 0)) {

      setError('Preencha nome e valor.')

      return

    }

    startTransition(async () => {

      try {

        const updated = await updateExpense(expense.id, {
          name,
          value: numeric,
          notes,
          payment_method: null

        })

        if (updated) {

          on_updated(updated)

        }

        setEditing(false)

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  function handleDelete() {

    startTransition(async () => {

      try {

        await deleteExpense(expense.id)

        on_deleted(expense.id)

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  const has_notes = !!expense.notes?.trim()

  const is_from_recurring = !!expense.recurring_id

  function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    saveEdit()

  }

  function handleKeyDown(e: React.KeyboardEvent) {

    if (e.key === 'Escape') {

      e.preventDefault()

      cancelEdit()

    }

  }

  if (editing) {

    return (
      <li className='bg-bg-900/40 px-4 py-4'>

        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className='flex flex-col gap-3'
        >

          <div className='grid gap-3 md:grid-cols-[1fr_180px]'>

            <div>
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <Label>Valor</Label>
              <MoneyInput
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>

          </div>

          <div>
            <Label>Nota (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Ex: moto consertando, conta deste mês veio mais alta...'
            />
          </div>

          <div className='flex items-center justify-between gap-3'>

            {error ? (
              <span className='text-xs text-negative-soft'>{error}</span>
            ) : (
              <span className='text-[11px] text-text-300'>
                Enter salva. Esc cancela.
              </span>

            )}

            <div className='flex items-center gap-2'>

              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={cancelEdit}
              >
                <X className='h-3.5 w-3.5' />
                Cancelar
              </Button>

              <Button type='submit' size='sm' disabled={pending}>
                {pending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Check className='h-3.5 w-3.5' />

                )}
                Salvar
              </Button>

            </div>

          </div>

        </form>

      </li>

    )

  }

  return (
    <li className='group'>

      <div className='grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 px-4 py-3 text-sm'>

        <div className='flex items-center gap-2 min-w-0'>

          <span className='truncate text-text-50'>{expense.name}</span>

          {is_from_recurring && (
            <Repeat
              className='h-3 w-3 shrink-0 text-text-300'
              aria-label='Recorrente'
            />

          )}

          {has_notes && (
            <button
              type='button'
              onClick={() => setShowNotesView((s) => !s)}
              className={cn(
                'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-brand transition',
                show_notes_view ? 'bg-brand/20' : 'hover:bg-brand/15'

              )}
              aria-label='Ver nota'
            >
              <StickyNote className='h-3 w-3' />
            </button>

          )}

        </div>

        <span className='text-right text-text-100'>
          <Amount brl={Number(expense.value)} />
        </span>

        <button
          aria-label='Editar'
          onClick={startEdit}
          className='ml-1 text-text-300 hover:text-text-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition'
        >
          <Pencil className='h-3.5 w-3.5' />
        </button>

        <button
          aria-label='Remover'
          onClick={handleDelete}
          disabled={pending}
          className='text-text-300 hover:text-negative disabled:opacity-50'
        >
          {pending ? (
            <Loader2 className='h-3.5 w-3.5 animate-spin' />
          ) : (
            <Trash2 className='h-4 w-4' />

          )}
        </button>

        <span aria-hidden />

      </div>

      {show_notes_view && has_notes && (

        <div className='px-4 pb-3 -mt-1'>
          <div className='rounded-lg bg-bg-900/50 px-3 py-2 text-xs text-text-100 ring-1 ring-bg-700/40'>
            <span className='block text-[10px] uppercase tracking-wider text-text-300 mb-1'>
              Nota
            </span>
            {expense.notes}
          </div>
        </div>

      )}

    </li>

  )

}
