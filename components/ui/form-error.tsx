import { cn } from '@/lib/utils'

// Caixa de erro dos formularios — borda, fundo tenue e cantos arredondados,
// para o erro ficar contido em vez de solto como texto no meio do form.

export function FormError({
  children,
  className
}: {
  children: React.ReactNode
  className?: string

}) {

  return (
    <p
      role='alert'
      className={cn(
        'rounded-lg border border-negative bg-negative/20 px-3 py-2.5 text-xs leading-snug text-negative-soft',
        className

      )}
    >
      {children}
    </p>

  )

}
