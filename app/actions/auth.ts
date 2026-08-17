'use server'

import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

import { getSupabase } from '@/lib/supabase'

export type AuthResult = {

  error: string | null

  // true quando o cadastro foi criado mas ainda precisa de confirmacao por email
  needs_confirmation?: boolean

}

export async function signIn(email: string, password: string): Promise<AuthResult> {

  if (!email.trim() || !password) {

    return { error: 'Informe email e senha.' }

  }

  const supabase = await getSupabase()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password

  })

  if (error) {

    const code = (error as { code?: string }).code ?? ''

    const message = error.message ?? ''

    console.error('[signIn] falhou:', {
      status: (error as { status?: number }).status,
      code,
      name: error.name,
      message

    })

    // Email cadastrado mas ainda nao confirmado. E o caso mais confuso:
    // o Supabase recusa o login e parece "senha errada".
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) {

      return {
        error:
          'Este email ainda nao foi confirmado. Clique no link que o Supabase enviou, ou desligue "Confirm email" em Authentication > Email no painel.',
        needs_confirmation: true

      }

    }

    if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {

      return { error: 'Email ou senha invalidos.' }

    }

    // Qualquer outro motivo: mostra o real, para nao esconder a causa.
    return { error: message || 'Nao foi possivel entrar.' }

  }

  revalidatePath('/', 'layout')

  return { error: null }

}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {

  if (!name.trim()) {

    return { error: 'Informe seu nome.' }

  }

  if (!email.trim() || !password) {

    return { error: 'Informe email e senha.' }

  }

  if (password.length < 8) {

    return { error: 'A senha precisa ter ao menos 8 caracteres.' }

  }

  const supabase = await getSupabase()

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {

      data: { full_name: name.trim() }

    }

  })

  if (error) {

    const status = (error as { status?: number }).status ?? 0

    const raw = (error.message ?? '').trim()

    console.error('[signUp] falhou:', {
      status,
      code: (error as { code?: string }).code,
      name: error.name,
      message: raw

    })

    // Erro de servidor (500) ou corpo vazio/opaco: o Supabase nao deu um motivo
    // util. Quase sempre e o trigger de seed no banco falhando ao criar o usuario.
    const is_opaque = raw === '' || raw === '{}' || raw === '[object Object]'

    if (status >= 500 || is_opaque) {

      return {
        error:
          'O servidor de autenticação retornou um erro ao criar a conta. Se persistir, verifique os Postgres Logs do Supabase (provável falha no trigger de seed).'

      }

    }

    if (/already registered|already been registered/i.test(raw)) {

      return { error: 'Este email já está cadastrado. Use "Entrar".' }

    }

    return { error: raw }

  }

  console.error('[signUp] ok:', {
    user_id: data.user?.id,
    email_confirmed_at: data.user?.email_confirmed_at ?? null,
    has_session: Boolean(data.session)

  })

  // Com "Confirm email" LIGADO, a sessao so nasce apos confirmar o email.
  // Detecta esse caso para a UI mostrar a mensagem certa.
  const has_session = Boolean(data.session)

  if (!has_session) {

    return { error: null, needs_confirmation: true }

  }

  revalidatePath('/', 'layout')

  return { error: null }

}

// =========================================================================
// CONTA
// =========================================================================

export type AccountInfo = {

  email: string

  full_name: string

}

export async function getAccount(): Promise<AccountInfo | null> {

  const supabase = await getSupabase()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {

    return null

  }

  const meta = data.user.user_metadata as { full_name?: string } | undefined

  return {
    email: data.user.email ?? '',
    full_name: meta?.full_name ?? ''

  }

}

export async function updateName(name: string): Promise<AuthResult> {

  if (!name.trim()) {

    return { error: 'Informe seu nome.' }

  }

  const supabase = await getSupabase()

  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() }

  })

  if (error) {

    return { error: error.message }

  }

  revalidatePath('/', 'layout')

  return { error: null }

}

export async function updatePassword(
  current_password: string,
  new_password: string
): Promise<AuthResult> {

  if (new_password.length < 8) {

    return { error: 'A nova senha precisa ter ao menos 8 caracteres.' }

  }

  const supabase = await getSupabase()

  const { data } = await supabase.auth.getUser()

  const email = data.user?.email

  if (!email) {

    return { error: 'Sessão expirada. Entre novamente.' }

  }

  // Confirma a senha atual antes de trocar — o updateUser sozinho nao pede,
  // entao qualquer sessao aberta poderia trocar a senha sem saber a antiga.
  const check = await supabase.auth.signInWithPassword({
    email,
    password: current_password

  })

  if (check.error) {

    return { error: 'Senha atual incorreta.' }

  }

  const { error } = await supabase.auth.updateUser({ password: new_password })

  if (error) {

    return { error: error.message }

  }

  return { error: null }

}

export async function signOut() {

  const supabase = await getSupabase()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  redirect('/login')

}
