'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { Check, Loader2 } from 'lucide-react'

import { updateName, updatePassword } from '@/app/actions/auth'

import type { AccountInfo } from '@/app/actions/auth'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { Input, Label } from '@/components/ui/input'

import {
  PasswordInput,
  isPasswordAcceptable
} from '@/components/ui/password-input'

import { useToast } from '@/components/ui/toast-provider'

import { PageHeader } from '@/components/budget/page-header'

export function AccountPage({ account }: { account: AccountInfo }) {

  const router = useRouter()

  const toast = useToast()

  const [name, setName] = useState(account.full_name)

  const [current, setCurrent] = useState('')

  const [next, setNext] = useState('')

  const [confirm, setConfirm] = useState('')

  const [saving_name, startNameTransition] = useTransition()

  const [saving_pass, startPassTransition] = useTransition()

  const name_dirty = name.trim() !== account.full_name

  function handleName(e: React.FormEvent) {

    e.preventDefault()

    startNameTransition(async () => {

      const res = await updateName(name)

      if (res.error) {

        toast.error(res.error)

        return

      }

      toast.success('Nome atualizado.')

      router.refresh()

    })

  }

  function handlePassword(e: React.FormEvent) {

    e.preventDefault()

    if (!current) {

      toast.error('Informe a senha atual.')

      return

    }

    if (!isPasswordAcceptable(next)) {

      toast.error('A nova senha é fraca — use ao menos 8 caracteres e combine maiúsculas, números ou símbolos.')

      return

    }

    if (next !== confirm) {

      toast.error('A confirmação não confere com a nova senha.')

      return

    }

    startPassTransition(async () => {

      const res = await updatePassword(current, next)

      if (res.error) {

        toast.error(res.error)

        return

      }

      setCurrent('')

      setNext('')

      setConfirm('')

      toast.success('Senha alterada.')

    })

  }

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Minha conta'
        subtitle='Seus dados de acesso.'
      />

      <div className='grid gap-6 lg:grid-cols-2'>

        <Card>

          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>

          <form onSubmit={handleName} className='flex flex-col gap-4'>

            <div>
              <Label>Email</Label>
              <Input value={account.email} disabled readOnly />
              <p className='mt-1.5 text-[11px] text-text-300'>
                O email não pode ser alterado por aqui.
              </p>
            </div>

            <div>
              <Label htmlFor='name' required>Nome</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete='name'
              />
            </div>

            <div className='flex justify-end'>
              <Button type='submit' size='sm' disabled={!name_dirty || saving_name}>
                {saving_name ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Check className='h-3.5 w-3.5' />

                )}
                Salvar nome
              </Button>
            </div>

          </form>

        </Card>

        <Card>

          <CardHeader>
            <CardTitle>Trocar senha</CardTitle>
          </CardHeader>

          <form onSubmit={handlePassword} className='flex flex-col gap-4'>

            <div>
              <Label htmlFor='current' required>Senha atual</Label>
              <PasswordInput
                id='current'
                value={current}
                onChange={setCurrent}
                autoComplete='current-password'
              />
            </div>

            <div>
              <Label htmlFor='next' required>Nova senha</Label>
              <PasswordInput
                id='next'
                value={next}
                onChange={setNext}
                autoComplete='new-password'
                show_strength
              />
            </div>

            <div>
              <Label htmlFor='confirm' required>Confirmar nova senha</Label>
              <PasswordInput
                id='confirm'
                value={confirm}
                onChange={setConfirm}
                autoComplete='new-password'
              />
              {confirm.length > 0 && confirm !== next && (
                <p className='mt-1.5 text-[11px] text-negative-soft'>
                  A confirmação não confere.
                </p>

              )}
            </div>

            <div className='flex justify-end'>
              <Button type='submit' size='sm' disabled={saving_pass}>
                {saving_pass ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Check className='h-3.5 w-3.5' />

                )}
                Alterar senha
              </Button>
            </div>

          </form>

        </Card>

      </div>

    </section>

  )

}
