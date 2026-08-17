import { NextResponse, type NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'

// Renova a sessao a cada request e protege as rotas: quem nao esta logado vai
// para /login; quem esta logado nao fica preso em /login.

const PUBLIC_PATHS = ['/login', '/auth']

export async function middleware(request: NextRequest) {

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {

    return response

  }

  const supabase = createServerClient(url, key, {
    cookies: {

      getAll() {

        return request.cookies.getAll()

      },

      setAll(cookies_to_set) {

        for (const { name, value } of cookies_to_set) {

          request.cookies.set(name, value)

        }

        response = NextResponse.next({ request })

        for (const { name, value, options } of cookies_to_set) {

          response.cookies.set(name, value, options)

        }

      }

    }

  })

  // getSession() le a sessao do COOKIE (sem rede) e so vai a rede quando o
  // token expirou (renova ~1x/hora). O middleware aqui e apenas gating de UX
  // (redirecionar quem nao tem sessao); a seguranca real esta no RLS — toda
  // query roda com o JWT validado pelo Postgres. getUser() faria uma chamada
  // de rede ao servidor de auth em TODA navegacao (~200ms por clique).
  const { data: { session } } = await supabase.auth.getSession()

  const user = session?.user ?? null

  const path = request.nextUrl.pathname

  const is_public = PUBLIC_PATHS.some((p) => path.startsWith(p))

  if (!user && !is_public) {

    const login_url = request.nextUrl.clone()

    login_url.pathname = '/login'

    return NextResponse.redirect(login_url)

  }

  if (user && path.startsWith('/login')) {

    const home_url = request.nextUrl.clone()

    home_url.pathname = '/'

    return NextResponse.redirect(home_url)

  }

  return response

}

export const config = {

  // Roda em tudo, menos assets estaticos e o favicon/icone.
  //
  // O '/' PRECISA estar separado: com basePath, o Next compila o padrao geral
  // como `^/<basePath>(?:/(...))` — o grupo do caminho e obrigatorio, entao a
  // raiz do app (`/<basePath>` sem barra final) escapa do middleware e a pagina
  // renderiza sem autenticacao.
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]

}
