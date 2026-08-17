'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const FIELD_BASE =
  'h-10 w-full rounded-lg border border-bg-600 bg-bg-900/60 px-3 text-sm text-text-50 placeholder:text-text-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/50 transition'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(

  ({ className, type = 'text', ...props }, ref) => {

    return (
      <input
        ref={ref}
        type={type}
        className={cn(FIELD_BASE, className)}
        {...props}
      />

    )

  }

)

Input.displayName = 'Input'

// Select nativo com a mesma caixa do Input. A seta fica por conta do sistema —
// o `color-scheme` definido em globals.css faz ela acompanhar o tema.

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(

  ({ className, children, ...props }, ref) => {

    return (
      <select
        ref={ref}
        className={cn(FIELD_BASE, 'cursor-pointer pr-2', className)}
        {...props}
      >
        {children}
      </select>

    )

  }

)

Select.displayName = 'Select'

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {

  // Marca o campo como obrigatorio com um "*" — evita escrever "(opcional)"
  // nos demais, que e o padrao do app.
  required?: boolean

}

export function Label({ className, required, children, ...props }: LabelProps) {

  return (
    <label
      className={cn('mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-brand', className)}
      {...props}
    >
      {children}

      {/* sem cor propria: herda a do label, entao acompanha qualquer
          variacao de cor passada via className */}
      {required && (

        <span className='ml-0.5' aria-hidden>*</span>

      )}

    </label>

  )

}
