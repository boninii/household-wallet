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

    return { error: 'Email ou senha invalidos.' }

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

  if (password.length < 6) {

    return { error: 'A senha precisa ter ao menos 6 caracteres.' }

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

    return { error: error.message }

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

export async function signOut() {

  const supabase = await getSupabase()

  await supabase.auth.signOut()

  revalidatePath('/', 'layout')

  redirect('/login')

}
