'use client'

import { useEffect, useState, useTransition } from 'react'

import { Check, Loader2 } from 'lucide-react'

import { updateIncome } from '@/app/actions/budget'

import { formatBRLPlain, parseBRL } from '@/lib/utils'

import { Label } from '@/components/ui/input'

import { MoneyInput } from '@/components/ui/money-input'

import { cn } from '@/lib/utils'

import { usePrivacy } from '@/components/shell/privacy-provider'

type Props = {

  budget_id: string

  initial: number

}

export function IncomeInput({ budget_id, initial }: Props) {

  const { hidden } = usePrivacy()

  const [value, setValue] = useState<string>(initial ? formatBRLPlain(initial) : '')

  const [saved_value, setSavedValue] = useState<number>(initial)

  const [pending, startTransition] = useTransition()

  const [just_saved, setJustSaved] = useState(false)

  useEffect(() => {

    setValue(initial ? formatBRLPlain(initial) : '')

    setSavedValue(initial)
  }, [initial, budget_id])

  const current_numeric = parseBRL(value)

  const dirty = Math.abs(current_numeric - saved_value) > 0.005

  function commit() {

    if (!dirty || pending) {

      return

    }

    startTransition(async () => {

      try {

        await updateIncome(budget_id, current_numeric)

        setSavedValue(current_numeric)

        setValue(current_numeric ? formatBRLPlain(current_numeric) : '')

        setJustSaved(true)

        setTimeout(() => setJustSaved(false), 1500)

      } catch (e) {

        console.error(e)

      }

    })

  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {

    if (e.key === 'Enter') {

      e.preventDefault()

      commit()

    }

    if (e.key === 'Escape') {

      setValue(saved_value ? formatBRLPlain(saved_value) : '')

    }

  }

  return (
    <div className='flex flex-col gap-1.5'>

      <Label>Renda do mês</Label>

      <div className='flex items-center gap-2'>

        <MoneyInput
          placeholder='0,00'
          value={hidden ? '••••' : value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          readOnly={hidden}
          className={cn(
            'w-44 font-medium transition-colors',
            dirty && !hidden && 'ring-1 ring-brand/60 border-brand',
            hidden && 'cursor-not-allowed opacity-70'

          )}
        />

        <button
          type='button'
          onClick={commit}
          disabled={!dirty || pending || hidden}
          title={
            hidden
              ? 'Ative a visualização para editar'
              : dirty
              ? 'Confirmar (Enter)'
              : just_saved
              ? 'Salvo'
              : 'Sem alterações'

          }
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition',
            dirty && !hidden
              ? 'bg-brand text-bg-900 hover:bg-brand-dark shadow-card'
              : just_saved && !hidden
              ? 'bg-positive/20 text-positive-soft'
              : 'bg-bg-800 text-text-300 cursor-not-allowed'

          )}
        >
          {pending ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Check className='h-4 w-4' />

          )}
        </button>

        {dirty && !hidden && (

          <span className='max-w-[150px] text-[10px] uppercase leading-tight tracking-wider text-brand'>
            Enter ou ✓ para confirmar
          </span>

        )}

      </div>

    </div>

  )

}
