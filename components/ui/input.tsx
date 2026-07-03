'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(

  ({ className, type = 'text', ...props }, ref) => {

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-10 w-full rounded-lg border border-bg-600 bg-bg-900/60 px-3 text-sm text-text-50 placeholder:text-text-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition',
          className

        )}
        {...props}
      />

    )

  }

)

Input.displayName = 'Input'

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {

  return (
    <label
      className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-brand', className)}
      {...props}
    />

  )

}
