'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

import {
  BarChart3,
  Layers,
  LineChart,
  ListChecks
} from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

import { PrivacyToggle } from './privacy-toggle'

import { ThemeToggle } from './theme-toggle'

import { UserMenu } from './user-menu'

const items = [

  { href: '/', label: 'Dashboard', icon: BarChart3 },

  { href: '/despesas', label: 'Despesas', icon: ListChecks },

  { href: '/categorias', label: 'Categorias', icon: Layers },

  { href: '/investimentos', label: 'Investimentos', icon: LineChart }

]

export function Sidebar() {

  const path = usePathname()

  // Estado otimista: o item pinta como ativo NO CLIQUE, sem esperar a rota
  // commitar. Quando o pathname muda de fato, o otimista é limpo.
  const [pressed, setPressed] = useState<string | null>(null)

  useEffect(() => {

    setPressed(null)
  }, [path])

  function isActive(href: string) {

    if (pressed) {

      return pressed === href

    }

    return href === '/' ? path === '/' : path.startsWith(href)

  }

  const nav_links = items.map((it) => {

    const active = isActive(it.href)

    const Icon = it.icon

    return (
      <Tooltip key={it.href}>

        <TooltipTrigger asChild>

          <Link
            href={it.href}
            prefetch={true}
            aria-label={it.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => setPressed(it.href)}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl transition-colors active:scale-95',
              active
                ? 'bg-brand text-brand-ink'
                : 'text-text-300 hover:bg-bg-800 hover:text-text-50'

            )}
          >
            <Icon className='h-5 w-5' />
          </Link>

        </TooltipTrigger>

        <TooltipContent side='right'>{it.label}</TooltipContent>

      </Tooltip>

    )

  })

  return (
    <>

      {/* Desktop: dock lateral flutuante, solto das bordas */}
      <aside className='fixed bottom-4 left-4 top-4 z-40 hidden w-[84px] flex-col items-center justify-between rounded-[26px] bg-bg-900 py-5 ring-1 ring-bg-700/60 shadow-card md:flex'>

        <div className='flex flex-col items-center gap-2.5'>

          {nav_links}

        </div>

        <div className='flex flex-col items-center gap-2.5'>

          <ThemeToggle />

          <PrivacyToggle />

          <UserMenu />

        </div>

      </aside>

      {/* Mobile: dock inferior com os mesmos itens */}
      <nav className='fixed inset-x-3 bottom-3 z-40 flex h-16 items-center justify-around rounded-2xl bg-bg-900 px-2 ring-1 ring-bg-700/60 shadow-card md:hidden'>

        {nav_links}

        <span className='h-8 w-px bg-bg-700/70' aria-hidden />

        <PrivacyToggle />

        <UserMenu compact />

      </nav>

    </>

  )

}
