'use client'

import { useMemo, useState } from 'react'

import { Check, Eye, EyeOff } from 'lucide-react'

import { cn } from '@/lib/utils'

import { PASSWORD_RULES } from '@/lib/validate'

import { Input } from './input'

// Campo de senha com botao de mostrar/ocultar. Com `show_strength`, exibe
// a lista de requisitos — todos obrigatorios. A regra vive em lib/validate
// para o servidor validar exatamente a mesma coisa.

function checkPassword(value: string) {

  return PASSWORD_RULES.map((r) => ({
    key: r.key,
    label: r.label,
    ok: r.test(value)

  }))

}

type Props = {

  id?: string

  value: string

  onChange: (value: string) => void

  placeholder?: string

  autoComplete?: string

  show_strength?: boolean

}

const TOTAL_RULES = PASSWORD_RULES.length

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

  // Todos os requisitos sao obrigatorios, entao a barra mostra progresso —
  // nao "forca" — e so fica verde quando a senha esta valida.
  const complete = score === TOTAL_RULES

  const level = complete
    ? { label: 'senha válida', color: 'bg-positive-soft', text: 'text-positive-soft' }
    : { label: `${score}/${TOTAL_RULES}`, color: 'bg-brand', text: 'text-text-300' }

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
