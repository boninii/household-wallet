'use server'

import { revalidatePath } from 'next/cache'

import { cookies } from 'next/headers'

import { getSupabase } from '@/lib/supabase'

import {
  WALLET_COOKIE,
  getActiveWalletId,
  getCurrentUserId
} from '@/lib/wallet'

// Gera token opaco para links de convite e de leitura publica.
function makeToken(): string {

  const bytes = new Uint8Array(24)

  crypto.getRandomValues(bytes)

  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

}

const INVITE_TTL_HOURS = 24

const PUBLIC_TTL_HOURS = 24

// =========================================================================
// MEMBROS E CONVITES (editor)
// =========================================================================

export type Member = {

  id: string

  member_id: string

  role: string

  name: string

  email: string

  created_at: string

}

export type Invite = {

  id: string

  email: string

  role: string

  token: string

  expires_at: string

  created_at: string

}

export async function listMembers(): Promise<Member[]> {

  const me = await getCurrentUserId()

  if (!me) {

    return []

  }

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('wallet_members')
    .select('id,member_id,role,member_email,created_at')
    .eq('owner_id', me)
    .order('created_at', { ascending: true })

  if (error) {

    return []

  }

  return (data ?? []).map((m: any) => ({
    id: m.id,
    member_id: m.member_id,
    role: m.role,
    name: m.member_email ?? 'Membro',
    email: m.member_email ?? '',
    created_at: m.created_at

  }))

}

export async function listInvites(): Promise<Invite[]> {

  const me = await getCurrentUserId()

  if (!me) {

    return []

  }

  const supabase = await getSupabase()

  const { data } = await supabase
    .from('wallet_invites')
    .select('id,email,role,token,expires_at,created_at')
    .eq('owner_id', me)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  return (data ?? []) as Invite[]

}

export async function createInvite(email: string): Promise<{
  error: string | null
  token?: string
}> {

  const clean = email.trim().toLowerCase()

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {

    return { error: 'Informe um email válido.' }

  }

  const me = await getCurrentUserId()

  if (!me) {

    return { error: 'Sessão expirada. Entre novamente.' }

  }

  const supabase = await getSupabase()

  const { data: user_data } = await supabase.auth.getUser()

  if (user_data.user?.email?.toLowerCase() === clean) {

    return { error: 'Esse é o seu próprio email.' }

  }

  const token = makeToken()

  const expires_at = new Date(Date.now() + INVITE_TTL_HOURS * 3600_000).toISOString()

  const { error } = await supabase.from('wallet_invites').insert({
    owner_id: me,
    email: clean,
    role: 'editor',
    token,
    expires_at

  })

  if (error) {

    return { error: error.message }

  }

  revalidatePath('/compartilhar')

  return { error: null, token }

}

export async function revokeInvite(id: string) {

  const supabase = await getSupabase()

  await supabase.from('wallet_invites').delete().eq('id', id)

  revalidatePath('/compartilhar')

}

export async function removeMember(id: string) {

  const supabase = await getSupabase()

  await supabase.from('wallet_members').delete().eq('id', id)

  revalidatePath('/compartilhar')

}

export async function getInviteInfo(token: string) {

  const supabase = await getSupabase()

  const { data, error } = await supabase.rpc('get_invite_info', {
    invite_token: token

  })

  if (error) {

    return { ok: false, error: error.message }

  }

  return data as { ok: boolean; error?: string; owner_name?: string; email?: string }

}

export async function acceptInvite(token: string): Promise<{ error: string | null }> {

  const supabase = await getSupabase()

  const { data, error } = await supabase.rpc('accept_wallet_invite', {
    invite_token: token

  })

  if (error) {

    return { error: error.message }

  }

  const result = data as { ok: boolean; error?: string }

  if (!result?.ok) {

    return { error: result?.error ?? 'Não foi possível aceitar o convite.' }

  }

  revalidatePath('/', 'layout')

  return { error: null }

}

// =========================================================================
// CARTEIRA ATIVA
// =========================================================================

export async function switchWallet(owner_id: string) {

  const store = await cookies()

  store.set(WALLET_COOKIE, owner_id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30

  })

  revalidatePath('/', 'layout')

}

export type WalletChoice = {

  owner_id: string

  label: string

  is_own: boolean

}

// Carteiras que a pessoa pode abrir: a dela + as que foi convidada a editar.
export async function listWalletChoices(): Promise<WalletChoice[]> {

  const me = await getCurrentUserId()

  if (!me) {

    return []

  }

  const supabase = await getSupabase()

  const { data } = await supabase
    .from('wallet_members')
    .select('owner_id,owner_name')
    .eq('member_id', me)

  const shared = (data ?? []).map((r: any) => ({
    owner_id: r.owner_id as string,
    label: r.owner_name ? `Carteira de ${r.owner_name}` : 'Carteira compartilhada',
    is_own: false

  }))

  return [
    { owner_id: me, label: 'Minha carteira', is_own: true },
    ...shared

  ]

}

// Estado do seletor: qual carteira esta ativa e quais existem.
export async function getWalletState(): Promise<{
  active_id: string
  choices: WalletChoice[]

}> {

  const [active_id, choices] = await Promise.all([
    getActiveWalletId().catch(() => ''),
    listWalletChoices()

  ])

  return { active_id, choices }

}

// =========================================================================
// LINK PUBLICO (visitante, somente investimentos)
// =========================================================================

export type PublicShare = {

  id: string

  token: string

  expires_at: string

  revoked_at: string | null

  created_at: string

}

export async function listPublicShares(): Promise<PublicShare[]> {

  const me = await getCurrentUserId()

  if (!me) {

    return []

  }

  const supabase = await getSupabase()

  const { data } = await supabase
    .from('public_shares')
    .select('id,token,expires_at,revoked_at,created_at')
    .eq('owner_id', me)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  return (data ?? []) as PublicShare[]

}

export async function createPublicShare(): Promise<{
  error: string | null
  token?: string
}> {

  const me = await getCurrentUserId()

  if (!me) {

    return { error: 'Sessão expirada. Entre novamente.' }

  }

  const supabase = await getSupabase()

  const token = makeToken()

  const expires_at = new Date(Date.now() + PUBLIC_TTL_HOURS * 3600_000).toISOString()

  const { error } = await supabase.from('public_shares').insert({
    owner_id: me,
    token,
    expires_at

  })

  if (error) {

    return { error: error.message }

  }

  revalidatePath('/compartilhar')

  return { error: null, token }

}

export async function revokePublicShare(id: string) {

  const supabase = await getSupabase()

  await supabase
    .from('public_shares')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/compartilhar')

}

// Leitura anonima (usada pela pagina /w/[token]) — a RPC valida token,
// revogacao e expiracao no banco.
export async function getSharedWallet(token: string) {

  const supabase = await getSupabase()

  const { data, error } = await supabase.rpc('get_shared_investments', {
    share_token: token

  })

  if (error) {

    return { ok: false as const, error: error.message }

  }

  return data as {
    ok: boolean
    error?: string
    owner_name?: string
    expires_at?: string
    items?: Array<Record<string, unknown>>

  }

}
