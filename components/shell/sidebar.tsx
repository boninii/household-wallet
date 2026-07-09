'use client'

import Link from 'next/link'

import { usePathname } from 'next/navigation'

import {
  Banknote,
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

import { BrandMark } from './brand-mark'

import { PrivacyToggle } from './privacy-toggle'

import { UserMenu } from './user-menu'

const items = [

  { href: '/', label: 'Dashboard', icon: BarChart3 },

  { href: '/despesas', label: 'Despesas', icon: ListChecks },

  { href: '/categorias', label: 'Categorias', icon: Layers },


  { href: '/financiamentos', label: 'Financiamentos', icon: Banknote },

  { href: '/investimentos', label: 'Investimentos', icon: LineChart }

]

export function Sidebar() {

  const path = usePathname()

  return (
    <aside className='fixed left-0 top-0 z-40 hidden h-screen w-[96px] flex-col items-center justify-between border-r border-bg-800 bg-bg-900/80 py-6 backdrop-blur md:flex'>

      <div className='flex flex-col items-center gap-3'>

        <Link
          href='/'
          prefetch={true}
          aria-label='Inicio'
          className='mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-bg-900 shadow-card'
        >
          <BrandMark className='h-6 w-6' />
        </Link>

        {items.map((it) => {

          const Active =
            it.href === '/' ? path === '/' : path.startsWith(it.href)

          const Icon = it.icon

          return (
            <Tooltip key={it.href}>

              <TooltipTrigger asChild>

                <Link
                  href={it.href}
                  prefetch={true}
                  aria-label={it.label}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl transition',
                    Active
                      ? 'bg-brand text-bg-900 shadow-card'
                      : 'text-text-300 hover:bg-bg-800 hover:text-text-50'

                  )}
                >
                  <Icon className='h-5 w-5' />
                </Link>

              </TooltipTrigger>

              <TooltipContent side='right'>{it.label}</TooltipContent>

            </Tooltip>

          )

        })}

      </div>

      <div className='flex flex-col items-center gap-4'>

        <PrivacyToggle />

        <UserMenu />

      </div>

    </aside>

  )

}
