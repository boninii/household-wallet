'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  Check,
  Copy,
  Link2,
  Loader2,
  Mail,
  Trash2,
  UserPlus
} from 'lucide-react'

import {
  createInvite,
  createPublicShare,
  removeMember,
  revokeInvite,
  revokePublicShare
} from '@/app/actions/sharing'

import type { Invite, Member, PublicShare } from '@/app/actions/sharing'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { Input, Label } from '@/components/ui/input'

import { useConfirm } from '@/components/ui/confirm-provider'

import { useToast } from '@/components/ui/toast-provider'

import { PageHeader } from '@/components/budget/page-header'

type Props = {

  members: Member[]

  invites: Invite[]

  shares: PublicShare[]

  base_url: string

}

function expiryLabel(iso: string): string {

  const diff = new Date(iso).getTime() - Date.now()

  if (diff <= 0) {

    return 'expirado'

  }

  const hours = Math.floor(diff / 3600_000)

  if (hours >= 1) {

    return `expira em ${hours}h`

  }

  return `expira em ${Math.max(1, Math.floor(diff / 60_000))} min`

}

export function SharingPage({ members, invites, shares, base_url }: Props) {

  const router = useRouter()

  const toast = useToast()

  const confirm = useConfirm()

  const [email, setEmail] = useState('')

  const [copied, setCopied] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function copy(text: string, key: string) {

    navigator.clipboard.writeText(text).then(
      () => {

        setCopied(key)

        setTimeout(() => setCopied(null), 1800)

      },
      () => toast.error('Não foi possível copiar. Copie manualmente.')

    )

  }

  function handleInvite(e: React.FormEvent) {

    e.preventDefault()

    startTransition(async () => {

      const res = await createInvite(email)

      if (res.error) {

        toast.error(res.error)

        return

      }

      setEmail('')

      toast.success('Convite criado. Copie o link e envie para a pessoa.')

      router.refresh()

    })

  }

  function handlePublicLink() {

    startTransition(async () => {

      const res = await createPublicShare()

      if (res.error) {

        toast.error(res.error)

        return

      }

      toast.success('Link criado. Vale por 24 horas.')

      router.refresh()

    })

  }

  async function handleRemoveMember(id: string, name: string) {

    const ok = await confirm({
      title: 'Remover acesso',
      description: `${name} perde o acesso à sua carteira imediatamente.`,
      confirm_label: 'Remover',
      danger: true

    })

    if (!ok) {

      return

    }

    startTransition(async () => {

      await removeMember(id)

      toast.success('Acesso removido.')

      router.refresh()

    })

  }

  function handleRevokeInvite(id: string) {

    startTransition(async () => {

      await revokeInvite(id)

      router.refresh()

    })

  }

  function handleRevokeShare(id: string) {

    startTransition(async () => {

      await revokePublicShare(id)

      toast.success('Link revogado.')

      router.refresh()

    })

  }

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Compartilhar'
        subtitle='Convide alguém para editar sua carteira, ou gere um link temporário para mostrar seus investimentos sem login.'
      />

      <div className='grid gap-6 lg:grid-cols-2'>

        <Card className='flex flex-col gap-5'>

          <CardHeader>
            <CardTitle>Editores</CardTitle>
            <span className='text-xs text-text-300'>acesso total à carteira</span>
          </CardHeader>

          <form onSubmit={handleInvite} className='flex flex-col gap-3'>

            <div>
              <Label htmlFor='invite-email' required>Email da pessoa</Label>
              <Input
                id='invite-email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='pessoa@email.com'
              />
              <p className='mt-1.5 text-[11px] text-text-300'>
                O convite vale 24h e só funciona para esse email.
              </p>
            </div>

            <div className='flex justify-end'>
              <Button type='submit' size='sm' disabled={pending}>
                {pending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <UserPlus className='h-3.5 w-3.5' />

                )}
                Criar convite
              </Button>
            </div>

          </form>

          {invites.length > 0 && (

            <div className='flex flex-col gap-2'>

              <p className='text-[11px] uppercase tracking-wider text-text-300'>
                Convites pendentes
              </p>

              {invites.map((inv) => {

                const url = `${base_url}/convite/${inv.token}`

                return (
                  <div
                    key={inv.id}
                    className='flex items-center gap-2 rounded-lg bg-bg-800/60 px-3 py-2'
                  >

                    <Mail className='h-3.5 w-3.5 shrink-0 text-text-300' />

                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm text-text-50'>{inv.email}</p>
                      <p className='text-[11px] text-text-300'>{expiryLabel(inv.expires_at)}</p>
                    </div>

                    <button
                      type='button'
                      onClick={() => copy(url, inv.id)}
                      className='rounded-md p-1.5 text-text-300 transition hover:bg-bg-700 hover:text-text-50'
                      aria-label='Copiar link do convite'
                    >
                      {copied === inv.id ? (
                        <Check className='h-4 w-4 text-positive-soft' />
                      ) : (
                        <Copy className='h-4 w-4' />

                      )}
                    </button>

                    <button
                      type='button'
                      onClick={() => handleRevokeInvite(inv.id)}
                      className='rounded-md p-1.5 text-text-300 transition hover:bg-bg-700 hover:text-negative'
                      aria-label='Cancelar convite'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>

                  </div>

                )

              })}

            </div>

          )}

          <div className='flex flex-col gap-2'>

            <p className='text-[11px] uppercase tracking-wider text-text-300'>
              Com acesso
            </p>

            {members.length === 0 ? (

              <p className='text-sm text-text-300'>
                Ninguém além de você edita esta carteira.
              </p>

            ) : (

              members.map((m) => (

                <div
                  key={m.id}
                  className='flex items-center gap-2 rounded-lg bg-bg-800/60 px-3 py-2'
                >

                  <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-700 text-xs font-semibold text-text-100'>
                    {(m.name || '?').charAt(0).toUpperCase()}
                  </span>

                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm text-text-50'>{m.name}</p>
                    <p className='text-[11px] text-text-300'>{m.role}</p>
                  </div>

                  <button
                    type='button'
                    onClick={() => handleRemoveMember(m.id, m.name)}
                    className='rounded-md p-1.5 text-text-300 transition hover:bg-bg-700 hover:text-negative'
                    aria-label='Remover acesso'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>

                </div>

              ))

            )}

          </div>

        </Card>

        <Card className='flex flex-col gap-5'>

          <CardHeader>
            <CardTitle>Link de visitante</CardTitle>
            <span className='text-xs text-text-300'>só investimentos, sem login</span>
          </CardHeader>

          <div>

            <p className='text-sm text-text-300'>
              Gera um endereço secreto que mostra seus investimentos em modo
              leitura. Vale 24 horas e pode ser revogado a qualquer momento.
            </p>

            <div className='mt-4 flex justify-end'>
              <Button size='sm' onClick={handlePublicLink} disabled={pending}>
                {pending ? (
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                ) : (
                  <Link2 className='h-3.5 w-3.5' />

                )}
                Gerar link
              </Button>
            </div>

          </div>

          <div className='flex flex-col gap-2'>

            {shares.length === 0 ? (

              <p className='text-sm text-text-300'>Nenhum link ativo.</p>

            ) : (

              shares.map((s) => {

                const url = `${base_url}/w/${s.token}`

                return (
                  <div
                    key={s.id}
                    className='flex items-center gap-2 rounded-lg bg-bg-800/60 px-3 py-2'
                  >

                    <Link2 className='h-3.5 w-3.5 shrink-0 text-text-300' />

                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-[12px] text-text-100'>{url}</p>
                      <p className='text-[11px] text-text-300'>{expiryLabel(s.expires_at)}</p>
                    </div>

                    <button
                      type='button'
                      onClick={() => copy(url, s.id)}
                      className='rounded-md p-1.5 text-text-300 transition hover:bg-bg-700 hover:text-text-50'
                      aria-label='Copiar link'
                    >
                      {copied === s.id ? (
                        <Check className='h-4 w-4 text-positive-soft' />
                      ) : (
                        <Copy className='h-4 w-4' />

                      )}
                    </button>

                    <button
                      type='button'
                      onClick={() => handleRevokeShare(s.id)}
                      className='rounded-md p-1.5 text-text-300 transition hover:bg-bg-700 hover:text-negative'
                      aria-label='Revogar link'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>

                  </div>

                )

              })

            )}

          </div>

        </Card>

      </div>

    </section>

  )

}
