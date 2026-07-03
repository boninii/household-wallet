'use client'

import { createContext, useCallback, useContext, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from './dialog'

import { Button } from './button'

export type ConfirmOptions = {

  title?: string

  description?: string

  confirm_label?: string

  cancel_label?: string

  danger?: boolean

}

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn>(async () => false)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {

  const [opts, setOpts] = useState<ConfirmOptions | null>(null)

  const [resolver, setResolver] = useState<{ fn: (v: boolean) => void } | null>(null)

  const confirm = useCallback<ConfirmFn>((o) => {

    setOpts(o ?? {})

    return new Promise<boolean>((resolve) => {

      setResolver({ fn: resolve })

    })

  }, [])

  function close(result: boolean) {

    if (resolver) {

      resolver.fn(result)

    }

    setResolver(null)

    setOpts(null)

  }

  return (
    <ConfirmContext.Provider value={confirm}>

      {children}

      <Dialog
        open={!!opts}
        onOpenChange={(o) => {

          if (!o) {

            close(false)

          }

        }}
      >

        {opts && (

          <DialogContent className='max-w-md'>

            <DialogHeader>

              <DialogTitle>{opts.title ?? 'Confirmar ação'}</DialogTitle>

              {opts.description && (

                <DialogDescription>{opts.description}</DialogDescription>

              )}

            </DialogHeader>

            <div className='mt-6 flex justify-end gap-3'>

              <Button variant='subtle' size='sm' onClick={() => close(false)}>
                {opts.cancel_label ?? 'Cancelar'}
              </Button>

              <Button
                variant={opts.danger ? 'danger' : 'primary'}
                size='sm'
                onClick={() => close(true)}
              >
                {opts.confirm_label ?? 'Confirmar'}
              </Button>

            </div>

          </DialogContent>

        )}

      </Dialog>

    </ConfirmContext.Provider>

  )

}

export function useConfirm(): ConfirmFn {

  return useContext(ConfirmContext)

}
