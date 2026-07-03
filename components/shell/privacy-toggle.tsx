'use client'

import { Eye, EyeOff } from 'lucide-react'

import { usePrivacy } from './privacy-provider'

import { cn } from '@/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

export function PrivacyToggle() {

  const { hidden, toggle } = usePrivacy()

  return (
    <Tooltip>

      <TooltipTrigger asChild>

        <button
          onClick={toggle}
          aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition',
            hidden
              ? 'bg-brand text-bg-900 shadow-card'
              : 'bg-bg-800 text-text-300 hover:bg-bg-700 hover:text-text-50'

          )}
        >
          {hidden ? (
            <EyeOff className='h-5 w-5' />
          ) : (
            <Eye className='h-5 w-5' />

          )}
        </button>

      </TooltipTrigger>

      <TooltipContent side='right'>
        {hidden ? 'Mostrar valores' : 'Ocultar valores'}
      </TooltipContent>

    </Tooltip>

  )

}
