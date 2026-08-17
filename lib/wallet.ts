import { cookies } from 'next/headers'

import { getSupabase } from './supabase'

// Qual carteira o usuario esta vendo agora.
//
// Depois do compartilhamento, uma pessoa pode acessar mais de uma carteira: a
// dela e as de quem a convidou. O `user_id` das tabelas continua sendo o DONO
// da carteira, entao toda query precisa filtrar por esse id explicitamente —
// a RLS sozinha passou a devolver a UNIAO das carteiras acessiveis.
//
// A carteira ativa fica num cookie e e sempre revalidada contra a lista de
// acessos (cookie e dado do cliente, nao fonte de verdade).

export const WALLET_COOKIE = 'wallet'

export type WalletOption = {

  owner_id: string

  label: string

  is_own: boolean

}

export async function getCurrentUserId(): Promise<string | null> {

  const supabase = await getSupabase()

  const { data } = await supabase.auth.getUser()

  return data.user?.id ?? null

}

// Ids das carteiras que o usuario pode abrir (a propria + as compartilhadas).
export async function getAccessibleWalletIds(): Promise<string[]> {

  const me = await getCurrentUserId()

  if (!me) {

    return []

  }

  const supabase = await getSupabase()

  const { data } = await supabase
    .from('wallet_members')
    .select('owner_id')
    .eq('member_id', me)

  const shared = (data ?? []).map((r: { owner_id: string }) => r.owner_id)

  return [me, ...shared]

}

// Dono da carteira ativa. Cai na propria carteira se o cookie estiver ausente
// ou apontar para uma carteira que o usuario nao acessa mais (acesso revogado).
export async function getActiveWalletId(): Promise<string> {

  const me = await getCurrentUserId()

  if (!me) {

    throw new Error('Sessão expirada. Entre novamente.')

  }

  const store = await cookies()

  const picked = store.get(WALLET_COOKIE)?.value

  if (!picked || picked === me) {

    return me

  }

  const supabase = await getSupabase()

  const { data } = await supabase
    .from('wallet_members')
    .select('owner_id')
    .eq('member_id', me)
    .eq('owner_id', picked)
    .maybeSingle()

  return data ? picked : me

}
