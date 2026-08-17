'use client'

import { useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import { Check, Loader2 } from 'lucide-react'

import { acceptInvite } from '@/app/actions/sharing'

import { Button } from '@/components/ui/button'

import { FormError } from '@/components/ui/form-error'

type Props = {

  token: string

  owner_name: string

  email: string

}

export function AcceptInvite({ token, owner_name, email }: Props) {

  const router = useRouter()

  const [error, setError] = useState<string | null>(null)

  const [pending, startTransition] = useTransition()

  function handleAccept() {

    setError(null)

    startTransition(async () => {

      const res = await acceptInvite(token)

      if (res.error) {

        setError(res.error)

        return

      }

      router.replace('/')

      router.refresh()

    })

  }

  return (
    <>

      <h1 className='font-display text-2xl font-semibold text-text-50'>
        {owner_name} quer compartilhar a carteira com você
      </h1>

      <p className='mt-3 text-sm text-text-300'>
        Ao aceitar, você poderá ver e editar os lançamentos dessa carteira.
        O convite foi enviado para <strong className='text-text-50'>{email}</strong>.
      </p>

      {error && (

        <FormError className='mt-4 text-left'>{error}</FormError>

      )}

      <Button size='lg' onClick={handleAccept} disabled={pending} className='mt-6'>
        {pending ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <Check className='h-4 w-4' />

        )}
        Aceitar convite
      </Button>

    </>

  )

}
