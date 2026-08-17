import { AuthForm } from '@/components/auth/auth-form'

// Mesma tela do /login, abrindo direto na aba de cadastro. Serve para linkar
// "crie sua conta" — inclusive a partir do convite de editor.

type PageProps = {

  searchParams: { next?: string }

}

export default function Page({ searchParams }: PageProps) {

  return <AuthForm initial_mode='signup' next_param={searchParams.next} />

}
