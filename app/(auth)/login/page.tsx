import { AuthForm } from '@/components/auth/auth-form'

type PageProps = {

  searchParams: { next?: string }

}

export default function Page({ searchParams }: PageProps) {

  return <AuthForm initial_mode='signin' next_param={searchParams.next} />

}
