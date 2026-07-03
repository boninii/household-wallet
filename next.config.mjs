/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

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
  }
}

export default nextConfig
