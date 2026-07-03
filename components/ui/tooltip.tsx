'use client'

import * as React from 'react'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'

import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root

export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(

  ({ className, sideOffset = 6, ...props }, ref) => (

    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-md bg-bg-800 px-2.5 py-1.5 text-xs text-text-50 shadow-card ring-1 ring-bg-700',
        className

      )}
      {...props}
    />

  )

)

TooltipContent.displayName = TooltipPrimitive.Content.displayName
