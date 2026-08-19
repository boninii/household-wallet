/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Entrega o stack de graca para quem faz reconhecimento. Nao custa nada tirar.
  poweredByHeader: false,

  // O app roda na RAIZ do proprio subdominio (householdwallet.obonini.dev.br), entao
  // NEXT_PUBLIC_BASE_PATH fica VAZIO em producao. A opcao segue aqui caso um dia
  // seja preciso servir sob sub-caminho de novo: definir a env no BUILD. Sem ela, raiz.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,

  // ───────────────────────────────────────────────────────────────────────
  // CACHE DE NAVEGAÇÃO (Router Cache do Next)
  //
  // Guarda no cliente o resultado já renderizado de cada rota, então voltar
  // a uma aba que você acabou de ver fica instantâneo (não vai ao Supabase
  // de novo). Combina com o prefetch da sidebar: passar o mouse já aquece.
  //
  // NÃO atrapalha o dinâmico: todo lançamento/edição/exclusão chama
  // revalidatePath no server action, o que invalida este cache na hora e
  // rebusca em segundo plano. O dado nunca fica preso.
  //
  // Para DESLIGAR: comente o bloco `staleTimes` inteiro e reinicie o servidor.
  //   - dynamic: segundos que uma página dinâmica fica em cache no cliente
  //   - static:  idem para páginas estáticas
  // ───────────────────────────────────────────────────────────────────────
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 300
    }
  },

  // ───────────────────────────────────────────────────────────────────────
  // CABEÇALHOS DE SEGURANÇA
  //
  // O Traefik não injeta nenhum destes: antes disso, a resposta de produção
  // saía apenas com "X-Powered-By: Next.js". São todos headers de resposta,
  // não mudam nada do comportamento do app.
  // ───────────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // `:path*` casa com zero ou mais segmentos, então cobre a raiz também.
        // O source é relativo ao basePath — não repita /household-wallet aqui.
        source: '/:path*',
        headers: [
          {
            // Depois da primeira visita, o navegador se recusa a falar HTTP
            // com este host. Sem `preload` de propósito: entrar na lista de
            // preload dos navegadores é um caminho de volta demorado, e isso
            // é uma decisão que merece ser tomada à parte.
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            // Clickjacking: o app tem botões de excluir, e um overlay dentro
            // de um iframe transforma um clique inocente em exclusão.
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            // CSP moderno equivalente ao X-Frame-Options (navegadores novos
            // usam este; o de cima cobre os antigos).
            //
            // Só `frame-ancestors` de propósito: um CSP completo com
            // `script-src` exige nonce por request no Next e quebra a
            // hidratação se feito pela metade. Fica como trabalho separado.
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            // Não vaza a URL interna (que pode conter o token de carteira
            // compartilhada) no Referer ao sair para outro site.
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            // O app não usa nenhuma dessas APIs; negar explicitamente evita
            // que um script de terceiro as peça em nome do site.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()'
          }
        ]
      }
    ]
  }
}

export default nextConfig
