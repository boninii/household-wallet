// Freio de tentativas, em memoria, sem dependencia externa.
//
// POR QUE ISSO EXISTE: o login roda em server action, entao a chamada ao
// Supabase sai do NOSSO servidor. O rate limit por IP que o Supabase aplica
// enxerga um unico IP — o do container — para o mundo inteiro. Isso nao trava
// o atacante (ele nao e distinguivel por IP) e ainda permite que um atacante
// sozinho esgote a cota compartilhada, derrubando o login de todos os usuarios
// legitimos. O contador precisa ficar aqui.
//
// LIMITE DO DESENHO: o estado vive no processo. Middleware e server actions
// rodam em runtimes separados, entao cada um carrega sua propria instancia
// (tudo bem: guardam rotas diferentes). Se um dia houver mais de uma replica
// no Easypanel, o limite passa a valer POR REPLICA — nesse momento o contador
// tem que sair daqui para um Redis.

export type Bucket = {

  // Tentativas dentro da janela corrente.
  hits: number

  // Inicio da janela corrente, em ms (epoch).
  window_start: number

  // Quantas vezes esta chave ja estourou o limite. Alimenta o backoff
  // exponencial: quem insiste espera cada vez mais.
  strikes: number

  // Ate quando esta bloqueada, em ms (epoch). 0 = liberada.
  blocked_until: number

}

export type RateLimitRule = {

  // Tentativas permitidas por janela.
  limit: number

  window_ms: number

  // Duracao do primeiro bloqueio; dobra a cada reincidencia.
  block_ms: number

  // Teto do backoff.
  max_block_ms: number

}

export type Decision = {

  allowed: boolean

  retry_after_ms: number

  bucket: Bucket

}

// ---------------------------------------------------------------------------
// REGRAS
//
// Calibradas para um app domestico: generosas o bastante para quem erra a
// senha algumas vezes, restritivas o bastante para inviabilizar forca bruta.
// ---------------------------------------------------------------------------

const MINUTE = 60_000

const HOUR = 60 * MINUTE

// Por email: pega o atacante que troca de IP mas insiste na mesma conta.
export const LOGIN_BY_EMAIL: RateLimitRule = {
  limit: 8,
  window_ms: 10 * MINUTE,
  block_ms: 10 * MINUTE,
  max_block_ms: 1 * HOUR
}

// Por IP: pega o spray (muitas contas, poucas tentativas em cada). Mais folgado
// porque uma casa inteira sai pelo mesmo IP.
export const LOGIN_BY_IP: RateLimitRule = {
  limit: 20,
  window_ms: 10 * MINUTE,
  block_ms: 10 * MINUTE,
  max_block_ms: 1 * HOUR
}

// Criacao de conta: 5 por hora por IP ja e muito para uso real, e mata
// enumeracao de email em escala.
export const SIGNUP_BY_IP: RateLimitRule = {
  limit: 5,
  window_ms: 1 * HOUR,
  block_ms: 1 * HOUR,
  max_block_ms: 6 * HOUR
}

// Rotas anonimas com token (/w/ e /convite/). O token tem 192 bits, entao
// adivinhar e inviavel — isto aqui existe para ninguem martelar o banco.
export const PUBLIC_TOKEN_BY_IP: RateLimitRule = {
  limit: 60,
  window_ms: 1 * MINUTE,
  block_ms: 1 * MINUTE,
  max_block_ms: 15 * MINUTE
}

// ---------------------------------------------------------------------------
// DECISAO (pura — recebe o relogio, nao o consulta)
// ---------------------------------------------------------------------------

export function decide(
  bucket: Bucket | undefined,
  now: number,
  rule: RateLimitRule
): Decision {

  // Bloqueada: nem conta a tentativa. Martelar durante o bloqueio nao o
  // estende, mas tambem nao adianta nada.
  if (bucket && now < bucket.blocked_until) {

    return {
      allowed: false,
      retry_after_ms: bucket.blocked_until - now,
      bucket
    }

  }

  // Primeira vez, ou a janela anterior ja venceu. Os strikes SOBREVIVEM a
  // virada de janela — senao bastaria esperar a janela passar para zerar o
  // backoff e tentar de novo no mesmo ritmo, para sempre.
  if (!bucket || now - bucket.window_start >= rule.window_ms) {

    return {
      allowed: true,
      retry_after_ms: 0,
      bucket: {
        hits: 1,
        window_start: now,
        strikes: bucket?.strikes ?? 0,
        blocked_until: 0
      }
    }

  }

  const hits = bucket.hits + 1

  if (hits <= rule.limit) {

    return {
      allowed: true,
      retry_after_ms: 0,
      bucket: { ...bucket, hits }
    }

  }

  // Estourou: bloqueia com backoff exponencial, limitado pelo teto.
  const strikes = bucket.strikes + 1

  const block = Math.min(
    rule.block_ms * 2 ** (strikes - 1),
    rule.max_block_ms
  )

  return {
    allowed: false,
    retry_after_ms: block,
    bucket: {
      hits,
      window_start: bucket.window_start,
      strikes,
      blocked_until: now + block
    }
  }

}

// ---------------------------------------------------------------------------
// ARMAZENAMENTO
// ---------------------------------------------------------------------------

// Teto de chaves. Sem ele, o proprio contador vira vetor de DoS: as chaves vem
// de dado que o atacante controla (email e IP), entao um mapa sem limite cresce
// ate estourar a memoria do container.
const MAX_ENTRIES = 10_000

export class MemoryRateLimiter {

  private store = new Map<string, Bucket>()

  check(key: string, rule: RateLimitRule, now: number = Date.now()): Decision {

    const decision = decide(this.store.get(key), now, rule)

    // delete + set reinsere no fim: a ordem do Map passa a ser LRU, o que da
    // um criterio de despejo decente de graca.
    this.store.delete(key)

    this.store.set(key, decision.bucket)

    if (this.store.size > MAX_ENTRIES) {

      this.evict(now)

    }

    return decision

  }

  // Chamado quando a tentativa deu certo: quem acertou a senha nao carrega
  // punicao das tentativas anteriores.
  reset(key: string) {

    this.store.delete(key)

  }

  size() {

    return this.store.size

  }

  private evict(now: number) {

    for (const [key, bucket] of this.store) {

      if (this.store.size <= MAX_ENTRIES) {

        break

      }

      // Entradas BLOQUEADAS nunca sao despejadas por pressao de memoria. Se
      // fossem, bastaria inundar o mapa com chaves aleatorias para derrubar o
      // proprio bloqueio — o despejo viraria o bypass.
      if (now >= bucket.blocked_until) {

        this.store.delete(key)

      }

    }

  }

}

// Instancia compartilhada. As chaves sao prefixadas por contexto
// ('login:email:', 'pub:ip:', ...) para os contadores nao se misturarem.
export const limiter = new MemoryRateLimiter()

// ---------------------------------------------------------------------------
// IP DO CLIENTE
// ---------------------------------------------------------------------------

// Tipo estrutural de proposito: serve tanto para o `Headers` do middleware
// quanto para o `ReadonlyHeaders` que o next/headers devolve nas server actions.
export function clientIp(request_headers: { get(name: string): string | null }): string {

  const forwarded = request_headers.get('x-forwarded-for')

  if (forwarded) {

    const parts = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    // ATRAS DE UM UNICO PROXY CONFIAVEL (Traefik), o ultimo item e o unico que
    // vale: cada proxy ANEXA o IP de quem falou com ele. O que o cliente mandar
    // entra na FRENTE da lista, entao ler o primeiro seria bypass trivial —
    // o atacante manda 'X-Forwarded-For: 1.2.3.4' e troca de identidade a cada
    // requisicao. O ultimo item foi escrito pelo Traefik, nao pelo cliente.
    const observed = parts[parts.length - 1]

    if (observed) {

      return observed

    }

  }

  // O Traefik tambem sobrescreve este; serve de reserva.
  const real = request_headers.get('x-real-ip')

  if (real) {

    return real.trim()

  }

  // Dev local (sem proxy na frente): todo mundo cai no mesmo balde.
  return 'unknown'

}

export function formatRetryAfter(ms: number): string {

  const minutes = Math.ceil(ms / MINUTE)

  if (minutes <= 1) {

    return 'em instantes'

  }

  if (minutes < 60) {

    return `em ${minutes} minutos`

  }

  const hours = Math.ceil(minutes / 60)

  return hours === 1 ? 'em 1 hora' : `em ${hours} horas`

}
