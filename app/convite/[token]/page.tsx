import Link from 'next/link'

import { getInviteInfo } from '@/app/actions/sharing'

import { getCurrentUserId } from '@/lib/wallet'

import { AcceptInvite } from '@/components/sharing/accept-invite'

export const dynamic = 'force-dynamic'

type PageProps = {

  params: { token: string }

}

function Shell({ children }: { children: React.ReactNode }) {

  return (
    <main className='flex min-h-screen items-center justify-center px-6 py-10'>
      <div className='w-full max-w-md text-center'>{children}</div>
    </main>

  )

}

export default async function Page({ params }: PageProps) {

  const info = await getInviteInfo(params.token)

  if (!info?.ok) {

    return (
      <Shell>

        <h1 className='font-display text-2xl font-semibold text-text-50'>
          Convite indisponível
        </h1>

        <p className='mt-3 text-sm text-text-300'>
          {info?.error ?? 'Este convite não é mais válido.'}
        </p>

      </Shell>

    )

  }

  const me = await getCurrentUserId()

  if (!me) {

    return (
      <Shell>

        <h1 className='font-display text-2xl font-semibold text-text-50'>
          Convite para {info.owner_name}
        </h1>

        <p className='mt-3 text-sm text-text-300'>
          Para editar a carteira você precisa de uma conta com o email{' '}
          <strong className='text-text-50'>{info.email}</strong>.
        </p>

        <div className='mt-6 flex flex-col items-center gap-3'>

          <Link
            href={`/register?next=${encodeURIComponent(`/convite/${params.token}`)}`}
            className='inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-ink transition hover:bg-brand-dark'
          >
            Criar minha conta
          </Link>

          <Link
            href={`/login?next=${encodeURIComponent(`/convite/${params.token}`)}`}
            className='text-xs text-text-300 underline underline-offset-4 transition hover:text-text-50'
          >
            Já tenho conta — entrar
          </Link>

        </div>

      </Shell>

    )

  }

  return (
    <Shell>
      <AcceptInvite
        token={params.token}
        owner_name={info.owner_name ?? 'alguém'}
        email={info.email ?? ''}
      />
    </Shell>

  )

}
