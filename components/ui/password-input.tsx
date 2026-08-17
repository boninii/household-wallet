'use client'

import { useMemo, useState } from 'react'

import { Check, Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Input } from './input'

// Campo de senha com botao de mostrar/ocultar. Com `show_strength`, exibe
// tambem a barra de forca e a lista de requisitos (usado no cadastro).

export const PASSWORD_MIN = 8

export type PasswordCheck = {

  key: string

  label: string

  ok: boolean

}

export function checkPassword(value: string): PasswordCheck[] {

  return [
    { key: 'len', label: `Ao menos ${PASSWORD_MIN} caracteres`, ok: value.length >= PASSWORD_MIN },
    { key: 'case', label: 'Maiúscula e minúscula', ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { key: 'num', label: 'Um número', ok: /\d/.test(value) },
    { key: 'sym', label: 'Um símbolo', ok: /[^A-Za-z0-9]/.test(value) }

  ]

}

// Senha aceita: tamanho minimo + pelo menos 2 dos outros criterios.
export function isPasswordAcceptable(value: string): boolean {

  const checks = checkPassword(value)

  const len_ok = checks[0].ok

  const others = checks.slice(1).filter((c) => c.ok).length

  return len_ok && others >= 2

}

type Props = {

  id?: string

  value: string

  onChange: (value: string) => void

  placeholder?: string

  autoComplete?: string

  show_strength?: boolean

}

const LEVELS = [

  { label: 'fraca', color: 'bg-negative-soft', text: 'text-negative-soft' },

  { label: 'razoável', color: 'bg-brand', text: 'text-brand' },

  { label: 'boa', color: 'bg-brand', text: 'text-brand' },

  { label: 'forte', color: 'bg-positive-soft', text: 'text-positive-soft' }

]

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete,
  show_strength
}: Props) {

  const [visible, setVisible] = useState(false)

  const checks = useMemo(() => checkPassword(value), [value])

  const score = checks.filter((c) => c.ok).length

  const level = LEVELS[Math.max(0, score - 1)] ?? LEVELS[0]

  return (
    <div>

      <div className='relative'>

        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className='pr-11'
        />

        <button
          type='button'
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className='absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-300 transition hover:bg-bg-800 hover:text-text-50'
        >
          {visible ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </button>

      </div>

      {show_strength && value.length > 0 && (

        <div className='mt-2'>

          <div className='flex items-center gap-2'>

            <div className='flex h-1 flex-1 gap-1' aria-hidden>

              {[0, 1, 2, 3].map((i) => (

                <span
                  key={i}
                  className={cn(
                    'h-full flex-1 rounded-full transition-colors',
                    i < score ? level.color : 'bg-bg-700'

                  )}
                />

              ))}

            </div>

            <span className={cn('text-[11px] font-medium', level.text)}>
              {level.label}
            </span>

          </div>

          <ul className='mt-2 grid grid-cols-2 gap-x-3 gap-y-1'>

            {checks.map((c) => (

              <li
                key={c.key}
                className={cn(
                  'flex items-center gap-1.5 text-[11px]',
                  c.ok ? 'text-text-300' : 'text-text-500'

                )}
              >
                <Check
                  className={cn(
                    'h-3 w-3 shrink-0',
                    c.ok ? 'text-positive-soft' : 'text-bg-600'

                  )}
                />
                {c.label}
              </li>

            ))}

          </ul>

        </div>

      )}

    </div>

  )

}
