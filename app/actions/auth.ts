'use server'

import { revalidatePath } from 'next/cache'

import { headers } from 'next/headers'

import { redirect } from 'next/navigation'

import {
  LOGIN_BY_EMAIL,
  LOGIN_BY_IP,
  SIGNUP_BY_IP,
  clientIp,
  formatRetryAfter,
  limiter
} from '@/lib/rate-limit'

import { getSupabase } from '@/lib/supabase'

import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword
} from '@/lib/validate'

export type AuthResult = {

  error: string | null

  // true quando o cadastro foi criado mas ainda precisa de confirmacao por email
  needs_confirmation?: boolean

}

// Mensagem UNICA para qualquer falha de credencial no login. Separar "senha
// errada" de "email nao confirmado" (ou de "email inexistente") entregaria a
// um estranho a confirmacao de que aquele email tem conta aqui.
const INVALID_CREDENTIALS = 'Email ou senha inválidos.'

const AUTH_UNAVAILABLE =
  'O serviço de autenticação está indisponível. Tente novamente em instantes.'

// Mesma ideia no cadastro: a MESMA resposta para "email já cadastrado" e para
// erro desconhecido, para o retorno nao virar um oraculo de quem tem conta.
// Continua acionavel para quem apenas esqueceu que ja se cadastrou.
const SIGNUP_REJECTED =
  'Não foi possível criar a conta com esses dados. Se você já tem cadastro com este email, use "Entrar".'

async function requestIp() {

  return clientIp(await headers())

}

function tooManyAttempts(retry_after_ms: number): AuthResult {

  return {
    error: `Muitas tentativas. Tente novamente ${formatRetryAfter(retry_after_ms)}.`
  }

}

export async function signIn(email: string, password: string): Promise<AuthResult> {

  if (!email.trim() || !password) {

    return { error: 'Informe email e senha.' }

  }

  const account = email.trim().toLowerCase()

  const ip = await requestIp()

  // Dois baldes de proposito: o de IP pega o spray (muitas contas, poucas
  // tentativas em cada); o de email pega quem insiste na mesma conta trocando
  // de IP. Um sozinho deixa passar metade dos casos.
  const by_ip = limiter.check(`login:ip:${ip}`, LOGIN_BY_IP)

  if (!by_ip.allowed) {

    return tooManyAttempts(by_ip.retry_after_ms)

  }

  const by_account = limiter.check(`login:email:${account}`, LOGIN_BY_EMAIL)

  if (!by_account.allowed) {

    return tooManyAttempts(by_account.retry_after_ms)

  }

  const supabase = await getSupabase()

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password

  })

  if (error) {

    const status = (error as { status?: number }).status ?? 0

    // Log sem PII: o codigo basta para diagnosticar, email nao entra em log.
    console.warn('[auth] login recusado', {
      status,
      code: (error as { code?: string }).code ?? null

    })

    // Indisponibilidade do servidor nao e falha de credencial e nao revela
    // nada sobre a conta — vale dizer a verdade para nao mandar o usuario
    // caçar uma senha que esta correta.
    if (status >= 500) {

      return { error: AUTH_UNAVAILABLE }

    }

    return { error: INVALID_CREDENTIALS }

  }

  // Acertou a senha: nao carrega a punicao das tentativas anteriores.
  limiter.reset(`login:ip:${ip}`)

  limiter.reset(`login:email:${account}`)

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

  if (!isStrongPassword(password)) {

    return { error: PASSWORD_REQUIREMENTS_MESSAGE }

  }

  const ip = await requestIp()

  // Cadastro NAO zera o contador no sucesso: o que se quer limitar aqui e a
  // criacao de contas em si, entao a conta criada tambem precisa contar.
  const by_ip = limiter.check(`signup:ip:${ip}`, SIGNUP_BY_IP)

  if (!by_ip.allowed) {

    return tooManyAttempts(by_ip.retry_after_ms)

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

    console.warn('[auth] cadastro recusado', {
      status,
      code: (error as { code?: string }).code ?? null

    })

    // Erro de servidor (500) ou corpo vazio/opaco: o Supabase nao deu um motivo
    // util. Quase sempre e o trigger de seed no banco falhando ao criar o
    // usuario — e nada disso depende do email existir, entao pode ser especifico.
    const is_opaque = raw === '' || raw === '{}' || raw === '[object Object]'

    if (status >= 500 || is_opaque) {

      return {
        error:
          'O servidor de autenticação retornou um erro ao criar a conta. Se persistir, verifique os Postgres Logs do Supabase (provável falha no trigger de seed).'

      }

    }

    return { error: SIGNUP_REJECTED }

  }

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

  if (!isStrongPassword(new_password)) {

    return { error: PASSWORD_REQUIREMENTS_MESSAGE }

  }

  const supabase = await getSupabase()

  const { data } = await supabase.auth.getUser()

  const email = data.user?.email

  if (!email) {

    return { error: 'Sessão expirada. Entre novamente.' }

  }

  const account = email.toLowerCase()

  // A conferencia da senha atual (abaixo) e um signInWithPassword — ou seja,
  // um oraculo de senha. Entra no MESMO balde do login para nao virar a porta
  // dos fundos do rate limit.
  const attempt = limiter.check(`login:email:${account}`, LOGIN_BY_EMAIL)

  if (!attempt.allowed) {

    return tooManyAttempts(attempt.retry_after_ms)

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

  limiter.reset(`login:email:${account}`)

  const { error } = await supabase.auth.updateUser({ password: new_password })

  if (error) {

    return { error: error.message }

  }

  // Trocar a senha tem que expulsar quem estiver logado em outro dispositivo:
  // senao a troca nao resolve justamente o caso que motiva faze-la — alguem
  // com acesso indevido a uma sessao antiga continua dentro.
  // 'others' preserva a sessao atual, entao quem trocou a senha nao cai fora.
  await supabase.auth.signOut({ scope: 'others' })

  return { error: null }

}

export async function signOut() {

  const supabase = await getSupabase()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  redirect('/login')

}
