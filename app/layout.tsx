import type { Metadata } from 'next'

import { DM_Sans, Jost } from 'next/font/google'

import { AppShell } from '@/components/shell/app-shell'

import { PrivacyProvider } from '@/components/shell/privacy-provider'

import { ConfirmProvider } from '@/components/ui/confirm-provider'

import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css'

const dmSans = DM_Sans({

  weight: ['400', '500', '600', '700'],

  subsets: ['latin'],

  variable: '--font-display',

  display: 'swap'

})

const jost = Jost({

  subsets: ['latin'],

  variable: '--font-body',

  display: 'swap'

})

export const metadata: Metadata = {

  title: 'Household Wallet',

  description: 'Controle de orçamento doméstico e metas mensais'

}

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang='pt-BR' className={`${dmSans.variable} ${jost.variable}`}>
      <body className='min-h-screen bg-bg-950 text-text-50 antialiased'>

        <TooltipProvider delayDuration={200}>

          <ConfirmProvider>

          <PrivacyProvider>

          <AppShell>{children}</AppShell>

          </PrivacyProvider>

          </ConfirmProvider>

        </TooltipProvider>

      </body>
    </html>

  )

}
