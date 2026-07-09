import { createBrowserClient } from '@supabase/ssr'

// Cliente Supabase para uso no NAVEGADOR (client components). Compartilha a
// sessao via cookies com o cliente de servidor.

export function getSupabaseBrowser() {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {

    throw new Error('Supabase env vars ausentes. Configure .env.local.')

  }

  return createBrowserClient(url, key)

}
