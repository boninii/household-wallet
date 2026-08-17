import { headers } from 'next/headers'

import {
  listInvites,
  listMembers,
  listPublicShares
} from '@/app/actions/sharing'

import { SharingPage } from '@/components/sharing/sharing-page'

export const dynamic = 'force-dynamic'

// Monta a origem publica (respeitando proxy e basePath) para os links copiaveis.
async function getBaseUrl(): Promise<string> {

  const h = await headers()

  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'

  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')

  const base_path = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  return `${proto}://${host}${base_path}`

}

export default async function Page() {

  const [members, invites, shares, base_url] = await Promise.all([
    listMembers(),
    listInvites(),
    listPublicShares(),
    getBaseUrl()

  ])

  return (
    <SharingPage
      members={members}
      invites={invites}
      shares={shares}
      base_url={base_url}
    />

  )

}
