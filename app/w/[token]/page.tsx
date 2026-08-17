import { getSharedWallet } from '@/app/actions/sharing'

import { SharedWalletView } from '@/components/sharing/shared-wallet-view'

export const dynamic = 'force-dynamic'

type PageProps = {

  params: { token: string }

}

export default async function Page({ params }: PageProps) {

  const result = await getSharedWallet(params.token)

  if (!result.ok) {

    return (
      <main className='flex min-h-screen items-center justify-center px-6 py-10'>

        <div className='w-full max-w-md text-center'>

          <h1 className='font-display text-2xl font-semibold text-text-50'>
            Link indisponível
          </h1>

          <p className='mt-3 text-sm text-text-300'>
            {result.error ?? 'Este link não é mais válido.'}
          </p>

          <p className='mt-6 text-xs text-text-500'>
            Peça um link novo para quem compartilhou a carteira.
          </p>

        </div>

      </main>

    )

  }

  return (
    <SharedWalletView
      owner_name={result.owner_name ?? 'Carteira'}
      expires_at={result.expires_at ?? ''}
      items={(result.items ?? []) as never[]}
    />

  )

}
