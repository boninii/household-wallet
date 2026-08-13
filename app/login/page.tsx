'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { signIn, signUp } from '@/app/actions/auth'

import { Button } from '@/components/ui/button'

import { Input, Label } from '@/components/ui/input'

import { ThemeToggle } from '@/components/shell/theme-toggle'

type Mode = 'signin' | 'signup'

export default function LoginPage() {

  const router = useRouter()

  const [mode, setMode] = useState<Mode>('signin')

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

        router.replace('/')

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

      router.replace('/')

      router.refresh()

    })

  }

  function switchMode(next: Mode) {

    setMode(next)

    setError(null)

    setInfo(null)

  }

  return (
    <main className='relative flex min-h-screen items-center justify-center px-6 py-10'>

      <div className='absolute right-4 top-4'>
        <ThemeToggle />
      </div>

      <div className='w-full max-w-sm'>

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

        <div className='mb-6 grid grid-cols-2 gap-1 rounded-xl bg-bg-900/60 p-1 ring-1 ring-bg-800'>

          <button
            type='button'
            onClick={() => switchMode('signin')}
            className={
              'h-9 rounded-lg text-sm font-medium transition ' +
              (mode === 'signin'
                ? 'bg-brand text-brand-ink shadow-card'
                : 'text-text-300 hover:text-text-50')
            }
          >
            Entrar
          </button>

          <button
            type='button'
            onClick={() => switchMode('signup')}
            className={
              'h-9 rounded-lg text-sm font-medium transition ' +
              (mode === 'signup'
                ? 'bg-brand text-brand-ink shadow-card'
                : 'text-text-300 hover:text-text-50')
            }
          >
            Criar conta
          </button>

        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>

          {mode === 'signup' && (
            <div>

              <Label htmlFor='name'>Nome</Label>

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

            <Label htmlFor='email'>Email</Label>

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

            <Label htmlFor='password'>Senha</Label>

            <Input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />

          </div>

          {error && (
            <p className='text-sm text-negative'>{error}</p>
          )}

          {info && (
            <p className='text-sm text-positive-soft'>{info}</p>
          )}

          <Button type='submit' size='lg' disabled={pending} className='mt-1'>
            {pending
              ? 'Aguarde…'
              : mode === 'signin'
                ? 'Entrar'
                : 'Criar conta'}
          </Button>

        </form>

      </div>

    </main>

  )

}
