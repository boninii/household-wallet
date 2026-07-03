'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Check, Lock } from 'lucide-react'

import { COLOR_PRESETS } from '@/lib/categories'

import { cn } from '@/lib/utils'

type UsedBy = { color: string; label: string }

type Props = {

  value: string

  onChange: (color: string) => void

  used_by?: UsedBy[]

}

export function ColorPicker({ value, onChange, used_by }: Props) {

  const [open, setOpen] = useState(false)

  const [pos, setPos] = useState<'bottom' | 'top'>('bottom')

  const wrapper_ref = useRef<HTMLDivElement>(null)

  const trigger_ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {

    function handleClick(e: MouseEvent) {

      if (wrapper_ref.current && !wrapper_ref.current.contains(e.target as Node)) {

        setOpen(false)

      }

    }

    if (open) {

      document.addEventListener('mousedown', handleClick)

      return () => document.removeEventListener('mousedown', handleClick)

    }
  }, [open])

  useLayoutEffect(() => {

    if (!open || !trigger_ref.current) {

      return

    }

    const rect = trigger_ref.current.getBoundingClientRect()

    const space_below = window.innerHeight - rect.bottom

    const POPOVER_HEIGHT = 300

    setPos(space_below < POPOVER_HEIGHT ? 'top' : 'bottom')
  }, [open])

  // Mapa cor → categoria que está usando. Exclui a cor atualmente selecionada
  // (porque essa "pertence" ao próprio item sendo editado/criado).
  const used_map = new Map<string, string>()

  for (const u of used_by ?? []) {

    if (u.color !== value) {

      used_map.set(u.color, u.label)

    }

  }

  return (
    <div className='relative inline-block' ref={wrapper_ref}>

      <button
        ref={trigger_ref}
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-bg-700 hover:ring-bg-600 transition'
        style={{ background: value }}
        aria-label='Escolher cor'
      />

      {open && (

        <div
          className={cn(
            'absolute right-0 z-50 w-[280px] rounded-xl bg-bg-900 p-3 shadow-card ring-1 ring-bg-700 animate-in fade-in zoom-in-95 duration-150',
            pos === 'bottom' ? 'top-11' : 'bottom-11'

          )}
        >

          <p className='mb-2 text-[11px] uppercase tracking-wider text-text-300'>
            Cores disponíveis
          </p>

          <div className='grid grid-cols-5 gap-2'>

            {COLOR_PRESETS.map((c) => {

              const used_by_label = used_map.get(c)

              const is_used = !!used_by_label

              const is_selected = value === c

              return (
                <button
                  key={c}
                  type='button'
                  disabled={is_used}
                  onClick={() => {
                    onChange(c)
                    setOpen(false)

                  }}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition',
                    is_used
                      ? 'cursor-not-allowed ring-bg-700'
                      : 'ring-bg-700 hover:scale-110 hover:ring-text-50',
                    is_selected && 'ring-2 ring-text-50'

                  )}
                  style={{ background: c }}
                  title={
                    is_used
                      ? `em uso por: ${used_by_label}`
                      : is_selected
                      ? 'selecionada'
                      : c

                  }
                  aria-label={c}
                >
                  {is_selected && (
                    <Check className='h-4 w-4 text-bg-900 mix-blend-difference' />

                  )}

                  {is_used && (
                    <span className='flex h-5 w-5 items-center justify-center rounded-full bg-bg-950/80'>
                      <Lock className='h-3 w-3 text-text-50' />
                    </span>

                  )}
                </button>

              )

            })}

          </div>

          {used_map.size > 0 && (

            <p className='mt-2 text-[10px] text-text-300'>
              Cores com cadeado já estão em uso. Passe o mouse para ver qual categoria.
            </p>

          )}

        </div>

      )}

    </div>

  )

}
