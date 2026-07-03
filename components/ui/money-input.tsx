'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

import { Input, type InputProps } from './input'

type Props = InputProps & {

  prefix?: string

}

// Input de dinheiro com prefixo fixo (R$, US$...). O prefixo NÃO faz parte do
// valor editável: fica colado à esquerda e o usuário não consegue apagá-lo.
export const MoneyInput = React.forwardRef<HTMLInputElement, Props>(

  ({ prefix = 'R$', className, ...props }, ref) => {

    const pad = prefix.length > 2 ? 'pl-12' : 'pl-10'

    return (
      <div className='relative'>

        <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-sm font-medium text-text-300'>
          {prefix}
        </span>

        <Input
          ref={ref}
          inputMode='decimal'
          className={cn(pad, className)}
          {...props}
        />

      </div>

    )

  }

)

MoneyInput.displayName = 'MoneyInput'
