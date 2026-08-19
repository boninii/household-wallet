import { describe, expect, it } from 'vitest'

import {
  LOGIN_BY_EMAIL,
  MemoryRateLimiter,
  clientIp,
  decide,
  formatRetryAfter,
  type Bucket,
  type RateLimitRule
} from '@/lib/rate-limit'

// Este modulo e a unica coisa entre um atacante e o /login. Os testes abaixo
// cobrem o comportamento observavel (quantas tentativas passam, quanto tempo
// o bloqueio dura) e as duas propriedades de seguranca que dariam bypass se
// quebrassem: spoof de X-Forwarded-For e despejo de chave bloqueada.

const RULE: RateLimitRule = {
  limit: 3,
  window_ms: 1000,
  block_ms: 100,
  max_block_ms: 400
}

// Roda n tentativas seguidas no mesmo instante e devolve a ultima decisao.
function run(times: number, now = 0, rule: RateLimitRule = RULE) {

  let bucket: Bucket | undefined

  let last = decide(bucket, now, rule)

  bucket = last.bucket

  for (let i = 1; i < times; i++) {

    last = decide(bucket, now, rule)

    bucket = last.bucket

  }

  return last

}

describe('decide', () => {

  it('libera exatamente ate o limite da janela', () => {

    expect(run(1).allowed).toBe(true)

    expect(run(3).allowed).toBe(true)

  })

  it('bloqueia na tentativa seguinte ao limite', () => {

    const d = run(4)

    expect(d.allowed).toBe(false)

    expect(d.retry_after_ms).toBe(RULE.block_ms)

    expect(d.bucket.strikes).toBe(1)

  })

  it('martelar durante o bloqueio nao estende o castigo', () => {

    const blocked = run(4)

    const again = decide(blocked.bucket, 50, RULE)

    expect(again.allowed).toBe(false)

    // 100ms de bloqueio, 50ms decorridos: faltam 50, nao 100.
    expect(again.retry_after_ms).toBe(50)

    expect(again.bucket.blocked_until).toBe(blocked.bucket.blocked_until)

  })

  it('libera de novo quando a janela vira', () => {

    const blocked = run(4)

    const fresh = decide(blocked.bucket, RULE.window_ms + 1, RULE)

    expect(fresh.allowed).toBe(true)

    expect(fresh.bucket.hits).toBe(1)

  })

  it('backoff dobra a cada reincidencia e para no teto', () => {

    // 1o estouro: block_ms. Depois, cada nova rodada dobra — ate max_block_ms.
    let bucket = run(4).bucket

    expect(bucket.blocked_until).toBe(0 + 100)

    const durations: number[] = [100]

    let clock = 0

    for (let round = 0; round < 4; round++) {

      // Espera o bloqueio passar e a janela virar, e estoura de novo.
      clock = bucket.blocked_until + RULE.window_ms

      for (let i = 0; i < RULE.limit + 1; i++) {

        bucket = decide(bucket, clock, RULE).bucket

      }

      durations.push(bucket.blocked_until - clock)

    }

    expect(durations).toEqual([100, 200, 400, 400, 400])

  })

  it('strikes sobrevivem a virada de janela', () => {

    // Se zerassem, bastaria esperar a janela vencer para ter sempre o bloqueio
    // mais curto e martelar para sempre no mesmo ritmo.
    const blocked = run(4)

    const fresh = decide(blocked.bucket, RULE.window_ms + 1, RULE)

    expect(fresh.bucket.strikes).toBe(1)

  })

})

describe('MemoryRateLimiter', () => {

  it('conta por chave, sem vazar de uma para outra', () => {

    const rl = new MemoryRateLimiter()

    for (let i = 0; i < RULE.limit + 1; i++) {

      rl.check('a', RULE, 0)

    }

    expect(rl.check('a', RULE, 0).allowed).toBe(false)

    expect(rl.check('b', RULE, 0).allowed).toBe(true)

  })

  it('reset limpa a punicao (usado quando a senha acerta)', () => {

    const rl = new MemoryRateLimiter()

    for (let i = 0; i < RULE.limit + 1; i++) {

      rl.check('a', RULE, 0)

    }

    expect(rl.check('a', RULE, 0).allowed).toBe(false)

    rl.reset('a')

    expect(rl.check('a', RULE, 0).allowed).toBe(true)

  })

  it('SEGURANCA: inundar o mapa nao derruba um bloqueio ativo', () => {

    // O despejo por memoria e o ponto fraco obvio deste desenho: se ele pudesse
    // remover uma chave bloqueada, o atacante bloqueado mandaria 10k requisicoes
    // com chaves aleatorias e voltaria limpo. As bloqueadas tem que sobreviver.
    const rl = new MemoryRateLimiter()

    for (let i = 0; i < RULE.limit + 1; i++) {

      rl.check('victim', RULE, 0)

    }

    expect(rl.check('victim', RULE, 0).allowed).toBe(false)

    for (let i = 0; i < 12_000; i++) {

      rl.check(`flood-${i}`, RULE, 0)

    }

    // O teto de memoria foi respeitado...
    expect(rl.size()).toBeLessThanOrEqual(10_000)

    // ...e a chave bloqueada continua bloqueada.
    expect(rl.check('victim', RULE, 0).allowed).toBe(false)

  })

  it('usa Date.now() quando o instante nao e informado', () => {

    const rl = new MemoryRateLimiter()

    expect(rl.check('x', LOGIN_BY_EMAIL).allowed).toBe(true)

  })

})

describe('clientIp', () => {

  function headersOf(entries: Record<string, string>) {

    return new Headers(entries)

  }

  it('le o ULTIMO item do X-Forwarded-For, nao o primeiro', () => {

    // Cada proxy ANEXA o IP de quem falou com ele. Com um unico proxy
    // confiavel na frente, o ultimo item foi escrito pelo proxy.
    expect(
      clientIp(headersOf({ 'x-forwarded-for': '203.0.113.9' }))
    ).toBe('203.0.113.9')

    expect(
      clientIp(headersOf({ 'x-forwarded-for': '198.51.100.1, 203.0.113.9' }))
    ).toBe('203.0.113.9')

  })

  it('SEGURANCA: header forjado pelo cliente nao troca a identidade', () => {

    // O atacante manda 'X-Forwarded-For: 1.2.3.4' tentando um balde novo a cada
    // requisicao; o Traefik anexa o IP real no fim. Ler o primeiro item seria
    // bypass total do rate limit.
    const spoofed = clientIp(
      headersOf({ 'x-forwarded-for': '1.2.3.4, 203.0.113.9' })
    )

    expect(spoofed).not.toBe('1.2.3.4')

    expect(spoofed).toBe('203.0.113.9')

  })

  it('cai para x-real-ip e depois para "unknown"', () => {

    expect(clientIp(headersOf({ 'x-real-ip': '203.0.113.7' }))).toBe('203.0.113.7')

    expect(clientIp(headersOf({}))).toBe('unknown')

    // Header presente mas vazio nao pode virar chave vazia.
    expect(clientIp(headersOf({ 'x-forwarded-for': ' , ' }))).toBe('unknown')

  })

})

describe('formatRetryAfter', () => {

  it('arredonda para cima e escolhe a unidade', () => {

    expect(formatRetryAfter(0)).toBe('em instantes')

    expect(formatRetryAfter(30_000)).toBe('em instantes')

    expect(formatRetryAfter(90_000)).toBe('em 2 minutos')

    expect(formatRetryAfter(10 * 60_000)).toBe('em 10 minutos')

    expect(formatRetryAfter(60 * 60_000)).toBe('em 1 hora')

    expect(formatRetryAfter(3 * 60 * 60_000)).toBe('em 3 horas')

  })

})
