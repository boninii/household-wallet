'use client'

import { useEffect, useState } from 'react'

import { Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {

  const attr = document.documentElement.getAttribute('data-theme')

  if (attr === 'light' || attr === 'dark') {

    return attr

  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

}

export function ThemeToggle() {

  const [mounted, setMounted] = useState(false)

  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {

    setTheme(currentTheme())

    setMounted(true)
  }, [])

  function toggle() {

    const next: Theme = theme === 'dark' ? 'light' : 'dark'

    document.documentElement.setAttribute('data-theme', next)

    try {

      localStorage.setItem('theme', next)

    } catch {

      // localStorage indisponível — troca só nesta sessão.

    }

    setTheme(next)

  }

  // Antes de montar, um placeholder do mesmo tamanho evita mismatch de hidratação.
  if (!mounted) {

    return <div className='h-11 w-11' aria-hidden />

  }

  const to_label = theme === 'dark' ? 'Tema claro' : 'Tema escuro'

  return (
    <Tooltip>

      <TooltipTrigger asChild>

        <button
          onClick={toggle}
          aria-label={to_label}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition',
            'bg-bg-800 text-text-300 hover:bg-bg-700 hover:text-text-50'
          )}
        >
          {theme === 'dark' ? (
            <Sun className='h-5 w-5' />
          ) : (
            <Moon className='h-5 w-5' />
          )}
        </button>

      </TooltipTrigger>

      <TooltipContent side='right'>{to_label}</TooltipContent>

    </Tooltip>

  )

}
