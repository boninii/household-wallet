'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react'

import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'

// Feedback global de ações (erros, confirmações) sem dependências novas —
// mesmo padrão do ConfirmProvider: context + container fixo.
// No mobile os toasts ficam acima do dock inferior.

type ToastKind = 'error' | 'success' | 'info'

type ToastItem = {

  id: number

  kind: ToastKind

  message: string

}

type ToastApi = {

  error: (message: string) => void

  success: (message: string) => void

  info: (message: string) => void

}

const ToastContext = createContext<ToastApi>({

  error: () => {},

  success: () => {},

  info: () => {}

})

const ICONS: Record<ToastKind, typeof AlertCircle> = {

  error: AlertCircle,

  success: CheckCircle2,

  info: Info

}

const ICON_COLOR: Record<ToastKind, string> = {

  error: 'text-negative-soft',

  success: 'text-positive-soft',

  info: 'text-brand'

}

export function ToastProvider({ children }: { children: React.ReactNode }) {

  const [toasts, setToasts] = useState<ToastItem[]>([])

  const next_id = useRef(0)

  const dismiss = useCallback((id: number) => {

    setToasts((arr) => arr.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string) => {

    const id = ++next_id.current

    setToasts((arr) => [...arr.slice(-3), { id, kind, message }])

    const ttl = kind === 'error' ? 7000 : 4500

    setTimeout(() => dismiss(id), ttl)
  }, [dismiss])

  const api = useMemo<ToastApi>(() => ({

    error: (m) => push('error', m),

    success: (m) => push('success', m),

    info: (m) => push('info', m)

  }), [push])

  return (
    <ToastContext.Provider value={api}>

      {children}

      <div
        aria-live='polite'
        className='pointer-events-none fixed inset-x-3 bottom-24 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6'
      >

        {toasts.map((t) => {

          const Icon = ICONS[t.kind]

          return (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className='pointer-events-auto flex w-full items-start gap-3 rounded-xl bg-bg-900 p-3.5 pr-2.5 ring-1 ring-bg-700/70 shadow-card animate-in fade-in slide-in-from-bottom-2 duration-200 sm:w-[340px]'
            >

              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_COLOR[t.kind])} />

              <p className='flex-1 text-sm leading-snug text-text-100'>{t.message}</p>

              <button
                type='button'
                aria-label='Fechar aviso'
                onClick={() => dismiss(t.id)}
                className='rounded-md p-1 text-text-500 transition hover:bg-bg-800 hover:text-text-50'
              >
                <X className='h-4 w-4' />
              </button>

            </div>

          )

        })}

      </div>

    </ToastContext.Provider>

  )

}

export function useToast(): ToastApi {

  return useContext(ToastContext)

}
