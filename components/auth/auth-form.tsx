'use client'

import { useState, useTransition } from 'react'

import Link from 'next/link'

import { useRouter } from 'next/navigation'

import { signIn, signUp } from '@/app/actions/auth'

import { Button } from '@/components/ui/button'

import { Input, Label } from '@/components/ui/input'

import { FormError } from '@/components/ui/form-error'

import { PasswordInput } from '@/components/ui/password-input'

import {
  PASSWORD_REQUIREMENTS_MESSAGE,
  isStrongPassword
} from '@/lib/validate'

type Mode = 'signin' | 'signup'

// Formulario unico de login/cadastro. As rotas /login e /register renderizam
// o mesmo componente, mudando apenas a aba inicial.

type Props = {

  initial_mode?: Mode

  // Vem do servidor (searchParams da rota). Ler aqui com useSearchParams faria
  // o componente suspender a cada navegacao entre /login e /register — e, sem
  // fallback no Suspense, a tela piscava em branco.
  next_param?: string

}

export function AuthForm({ initial_mode = 'signin', next_param }: Props) {

  const router = useRouter()

  // Para onde ir depois de entrar. Aceita apenas caminho relativo — evita
  // redirecionar para fora do app (open redirect).
  const raw_next = next_param ?? ''

  const next =
    raw_next.startsWith('/') && !raw_next.startsWith('//') ? raw_next : '/'

  // O modo vem da rota (/login ou /register), nao de estado — a URL e a
  // fonte da verdade.
  const mode = initial_mode

  // Mantem o ?next= ao alternar entre entrar e cadastrar.
  function withNext(path: string) {

    return raw_next ? `${path}?next=${encodeURIComponent(next)}` : path

  }

  const [name, setName] = useState('')

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)

  const [info, setInfo] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {

    e.preventDefault()

    setError(null)

    setInfo(null)

    startTransition(async () => {

      if (mode === 'signin') {

        const res = await signIn(email, password)

        if (res.error) {

          setError(res.error)

          return

        }

        router.replace(next)

        router.refresh()

        return

      }

      const res = await signUp(name, email, password)

      if (res.error) {

        setError(res.error)

        return

      }

      if (res.needs_confirmation) {

        setInfo('Conta criada! Confirme pelo link enviado ao seu email para entrar.')

        return

      }

      router.replace(next)

      router.refresh()

    })

  }

  // Botao so habilita quando o formulario esta valido — os requisitos de senha
  // ja aparecem no checklist, entao nao precisa virar mensagem de erro.
  const email_ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const can_submit =
    mode === 'signin'
      ? email.trim().length > 0 && password.length > 0
      : name.trim().length > 0 && email_ok && isStrongPassword(password)

  // O <main>, a largura e o ThemeToggle vivem no layout do grupo (auth) —
  // assim nao remontam ao alternar entre /login e /register.
  return (
    <>

        <div className='mb-8 flex flex-col items-center gap-2 text-center'>

          <h1 className='font-display text-[26px] font-semibold tracking-[-0.015em] text-text-50'>
            Household Wallet
          </h1>

          <p className='text-sm text-text-300'>
            {mode === 'signin'
              ? 'Entre para acessar sua carteira.'
              : 'Crie sua conta para começar.'}
          </p>

        </div>

        {/* Abas sao links de verdade: /login e /register sao os enderecos
            oficiais de cada acao, entao a URL sempre reflete a tela. Preserva
            o ?next= para nao perder o destino (ex: voltar para um convite). */}
        <div className='mb-6 grid grid-cols-2 gap-1 rounded-xl bg-bg-900/60 p-1 ring-1 ring-bg-800'>

          <Link
            href={withNext('/login')}
            prefetch
            className={
              'flex h-9 items-center justify-center rounded-lg text-sm font-medium transition ' +
              (mode === 'signin'
                ? 'bg-brand text-brand-ink shadow-card'
                : 'text-text-300 hover:text-text-50')
            }
          >
            Entrar
          </Link>

          <Link
            href={withNext('/register')}
            prefetch
            className={
              'flex h-9 items-center justify-center rounded-lg text-sm font-medium transition ' +
              (mode === 'signup'
                ? 'bg-brand text-brand-ink shadow-card'
                : 'text-text-300 hover:text-text-50')
            }
          >
            Criar conta
          </Link>

        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>

          {mode === 'signup' && (
            <div>

              <Label htmlFor='name' required>Nome</Label>

              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Seu nome'
                autoComplete='name'
              />

            </div>
          )}

          <div>

            <Label htmlFor='email' required>Email</Label>

            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='voce@email.com'
              autoComplete='email'
            />

          </div>

          <div>

            <Label htmlFor='password' required>Senha</Label>

            <PasswordInput
              id='password'
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              show_strength={mode === 'signup'}
            />

          </div>

          {error && <FormError>{error}</FormError>}

          {info && (
            <p className='rounded-lg border border-positive-soft/60 bg-positive-soft/15 px-3 py-2.5 text-xs leading-snug text-positive-soft'>
              {info}
            </p>
          )}

          <Button
            type='submit'
            size='lg'
            disabled={pending || !can_submit}
            className='mt-1 text-sm'
          >
            {pending
              ? 'Aguarde…'
              : mode === 'signin'
                ? 'Entrar'
                : 'Criar conta'}
          </Button>

        </form>

    </>

  )

}
