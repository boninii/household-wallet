import type { Metadata } from 'next'

import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'

import { AppShell } from '@/components/shell/app-shell'

import { PrivacyProvider } from '@/components/shell/privacy-provider'

import { ConfirmProvider } from '@/components/ui/confirm-provider'

import { ToastProvider } from '@/components/ui/toast-provider'

import { TooltipProvider } from '@/components/ui/tooltip'

import './globals.css'

// Duas familias variáveis (1 arquivo cada): Bricolage para títulos, DM Sans
// para corpo/UI. Menos requests de fonte e hierarquia com mais personalidade.

const bricolage = Bricolage_Grotesque({

  subsets: ['latin'],

  variable: '--font-display',

  display: 'swap'

})

const dmSans = DM_Sans({

  subsets: ['latin'],

  variable: '--font-body',

  display: 'swap'

})

export const metadata: Metadata = {

  title: 'Household Wallet',

  description: 'Controle de orçamento doméstico e metas mensais'

}

// Define o tema (data-theme) ANTES da pintura para evitar flash: usa a escolha
// salva ou, na ausência, a preferência do sistema.
const themeScript = `
(function(){try{
  var t = localStorage.getItem('theme');
  if (t !== 'light' && t !== 'dark') {
    t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
}catch(e){}})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang='pt-BR' className={`${bricolage.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className='min-h-screen bg-bg-950 text-text-100 antialiased'>

        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        <TooltipProvider delayDuration={200}>

          <ToastProvider>

          <ConfirmProvider>

          <PrivacyProvider>

          <AppShell>{children}</AppShell>

          </PrivacyProvider>

          </ConfirmProvider>

          </ToastProvider>

        </TooltipProvider>

      </body>
    </html>

  )

}
