import { createServerClient } from '@supabase/ssr'

import { cookies } from 'next/headers'

// Cliente Supabase para uso no SERVIDOR (server actions e server components).
// Le a sessao do usuario a partir dos cookies, entao todas as queries rodam
// sob o RLS do usuario logado (auth.uid()). E criado por request — nao pode
// ser um singleton, pois cada request tem cookies diferentes.

export async function getSupabase() {

  const cookie_store = await cookies()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {

    throw new Error('Supabase env vars ausentes. Configure .env.local.')

  }

  return createServerClient(url, key, {
    cookies: {

      getAll() {

        return cookie_store.getAll()

      },

      setAll(cookies_to_set) {

        try {

          for (const { name, value, options } of cookies_to_set) {

            cookie_store.set(name, value, options)

          }

        } catch {

          // `setAll` foi chamado de um Server Component, onde nao se pode
          // escrever cookie. O middleware cuida de renovar a sessao, entao
          // pode ignorar com seguranca.

        }

      }

    }

  })

}
