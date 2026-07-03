'use server'

import { getSupabase } from '@/lib/supabase'

type CachedRate = {

  rate: number

  fetched_at: string

}

const CACHE_TTL_MIN = 60

const PAIR = 'USDBRL'

function isMissingFxTable(err: { message: string } | null): boolean {

  if (!err) {

    return false

  }

  return /fx_rates/.test(err.message)

}

export async function getCachedUsdBrlRate(): Promise<CachedRate> {

  const supabase = getSupabase()

  const cached = await supabase
    .from('fx_rates')
    .select('rate,fetched_at')
    .eq('pair', PAIR)
    .maybeSingle()

  if (cached.error && !isMissingFxTable(cached.error)) {

    throw new Error(cached.error.message)

  }

  if (cached.data) {

    const age_min =
      (Date.now() - new Date(cached.data.fetched_at).getTime()) / 60000

    if (age_min < CACHE_TTL_MIN) {

      return {
        rate: Number(cached.data.rate),
        fetched_at: cached.data.fetched_at

      }

    }

  }

  const fresh = await fetchFresh()

  const upsert = await supabase.from('fx_rates').upsert({
    pair: PAIR,
    rate: fresh,
    fetched_at: new Date().toISOString()

  })

  if (upsert.error && !isMissingFxTable(upsert.error)) {

    throw new Error(upsert.error.message)

  }

  return { rate: fresh, fetched_at: new Date().toISOString() }

}

export async function refreshUsdBrlRate(): Promise<CachedRate> {

  const supabase = getSupabase()

  const fresh = await fetchFresh()

  const upsert = await supabase.from('fx_rates').upsert({
    pair: PAIR,
    rate: fresh,
    fetched_at: new Date().toISOString()

  })

  if (upsert.error && !isMissingFxTable(upsert.error)) {

    throw new Error(upsert.error.message)

  }

  return { rate: fresh, fetched_at: new Date().toISOString() }

}

async function fetchFresh(): Promise<number> {

  const r = await fetch(
    'https://economia.awesomeapi.com.br/json/last/USD-BRL',
    { cache: 'no-store' }

  )

  if (!r.ok) {

    throw new Error(`Falha na cotacao (HTTP ${r.status})`)

  }

  const j = await r.json()

  const bid = Number(j?.USDBRL?.bid)

  if (!Number.isFinite(bid) || bid <= 0) {

    throw new Error('Resposta invalida da awesomeapi')

  }

  return bid

}
