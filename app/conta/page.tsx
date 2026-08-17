import { redirect } from 'next/navigation'

import { getAccount } from '@/app/actions/auth'

import { AccountPage } from '@/components/shell/account-page'

export const dynamic = 'force-dynamic'

export default async function Page() {

  const account = await getAccount()

  if (!account) {

    redirect('/login')

  }

  return <AccountPage account={account} />

}
