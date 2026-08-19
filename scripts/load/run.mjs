// Teste de carga progressivo com autocannon.
//
// Uso:
//   node scripts/load/run.mjs <plano.json> [base_url]
//
// O plano descreve cenarios e niveis de carga. Cada nivel roda em sequencia
// (carga progressiva). A saida e NDJSON no stdout — uma linha por nivel — com
// RPS, latencias (p50/p90/p97.5/p99), contagem por status HTTP, erros de
// socket e timeouts, mais timestamps para correlacionar com o sampler de
// CPU/memoria.
//
// Criterio de parada por cenario: se um nivel registrar mais de 2% de
// respostas inesperadas (4xx/5xx/erros), os niveis seguintes do MESMO cenario
// sao pulados — o ponto de degradacao ja foi encontrado.

import { readFileSync } from 'node:fs'

import autocannon from 'autocannon'

const plan_path = process.argv[2]

if (!plan_path) {

  console.error('uso: node scripts/load/run.mjs <plano.json> [base_url]')

  process.exit(1)

}

const plan = JSON.parse(readFileSync(plan_path, 'utf-8'))

const base = process.argv[3] ?? plan.base

function run(url, connections, duration) {

  return autocannon({
    url,
    connections,
    duration,
    // sem compressao: mede o custo de gerar a resposta, nao o gzip do proxy
    headers: { 'accept-encoding': 'identity' }

  })

}

function classify(status_stats, expected_prefixes) {

  let ok = 0

  let unexpected = 0

  for (const [code, info] of Object.entries(status_stats ?? {})) {

    const is_expected = expected_prefixes.some((p) => code.startsWith(p))

    if (is_expected) {

      ok += info.count

    } else {

      unexpected += info.count

    }

  }

  return { ok, unexpected }

}

for (const scenario of plan.scenarios) {

  let degraded = false

  for (const level of scenario.levels) {

    if (degraded) {

      console.log(JSON.stringify({
        scenario: scenario.name,
        connections: level.c,
        skipped: 'nivel anterior degradou'

      }))

      continue

    }

    const t_start = Date.now()

    const r = await run(base + scenario.path, level.c, level.d)

    const t_end = Date.now()

    const { ok, unexpected } = classify(r.statusCodeStats, scenario.expect)

    const total = ok + unexpected

    const bad_pct = total > 0 ? ((unexpected + r.errors + r.timeouts) / total) * 100 : 0

    console.log(JSON.stringify({
      scenario: scenario.name,
      path: scenario.path,
      connections: level.c,
      duration_s: level.d,
      rps_avg: r.requests.average,
      throughput_mb_s: +(r.throughput.average / 1024 / 1024).toFixed(2),
      lat_avg_ms: r.latency.average,
      lat_p50_ms: r.latency.p50,
      lat_p90_ms: r.latency.p90,
      lat_p97_5_ms: r.latency.p97_5,
      lat_p99_ms: r.latency.p99,
      lat_max_ms: r.latency.max,
      responses_ok: ok,
      responses_unexpected: unexpected,
      socket_errors: r.errors,
      timeouts: r.timeouts,
      bad_pct: +bad_pct.toFixed(2),
      status_codes: Object.fromEntries(
        Object.entries(r.statusCodeStats ?? {}).map(([k, v]) => [k, v.count])

      ),
      t_start,
      t_end

    }))

    if (bad_pct > 2) {

      degraded = true

    }

    // pausa curta entre niveis para o servidor drenar filas
    await new Promise((res) => setTimeout(res, 3000))

  }

}
