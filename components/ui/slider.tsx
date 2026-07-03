'use client'

import * as React from 'react'

import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '@/lib/utils'

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {

  trackColor?: string

}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(

  ({ className, trackColor = '#3B82F6', ...props }, ref) => {

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex h-5 w-full touch-none select-none items-center',
          className

        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-bg-700">

          <SliderPrimitive.Range
            className="absolute h-full rounded-full"
            style={{ background: trackColor }}
          />

        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb
          className="block h-4 w-4 rounded-full border-2 border-bg-900 shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
          style={{ background: trackColor }}
        />

      </SliderPrimitive.Root>

    )

  }

)

Slider.displayName = 'Slider'
