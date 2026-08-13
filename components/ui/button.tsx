'use client'

import * as React from 'react'

import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

// Variantes como mapas simples — mesmo resultado do cva, sem a dependência.

const BASE =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:pointer-events-none disabled:opacity-50'

const VARIANTS = {

  primary: 'bg-brand text-brand-ink hover:bg-brand-dark shadow-card',

  ghost: 'bg-transparent text-text-100 hover:bg-bg-800',

  outline: 'border border-bg-600 bg-transparent text-text-50 hover:bg-bg-800',

  danger: 'bg-negative text-white hover:bg-negative/90',

  subtle: 'bg-bg-800 text-text-100 hover:bg-bg-700 ring-1 ring-bg-700'

} as const

const SIZES = {

  sm: 'h-8 px-3 text-xs',

  md: 'h-10 px-4 text-sm',

  lg: 'h-11 px-6 text-base',

  icon: 'h-9 w-9 p-0'

} as const

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {

  variant?: keyof typeof VARIANTS

  size?: keyof typeof SIZES

  asChild?: boolean

}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(

  ({ className, variant = 'primary', size = 'md', asChild, ...props }, ref) => {

    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
        {...props}
      />

    )

  }

)

Button.displayName = 'Button'
