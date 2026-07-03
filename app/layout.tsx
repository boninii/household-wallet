import type { Metadata } from 'next'

import { DM_Sans, Jost } from 'next/font/google'

import { Sidebar } from '@/components/shell/sidebar'

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

          <Sidebar />

          <main className='min-h-screen px-8 py-8 md:pl-[112px] md:pr-8 lg:pl-[120px] lg:pr-14 lg:py-10'>

            <div className='mx-auto w-full max-w-[1480px]'>{children}</div>

          </main>

          </PrivacyProvider>

          </ConfirmProvider>

        </TooltipProvider>

      </body>
    </html>

  )

}
