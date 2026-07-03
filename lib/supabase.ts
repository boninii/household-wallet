import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cached_client: SupabaseClient | null = null

export function getSupabase() {

  if (cached_client) {

    return cached_client

  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {

    throw new Error('Supabase env vars ausentes. Configure .env.local.')

  }

  cached_client = createClient(url, key, {
    auth: { persistSession: false }

  })

  return cached_client

}
