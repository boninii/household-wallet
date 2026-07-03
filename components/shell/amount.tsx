'use client'

import { cn, formatBRL } from '@/lib/utils'

import { usePrivacy } from './privacy-provider'

type Props = {

  brl: number

  className?: string

}

export function Amount({ brl, className }: Props) {

  const { hidden, mask_brl } = usePrivacy()

  return (
    <span className={cn('tabular-nums', className)}>
      {hidden ? mask_brl : formatBRL(brl || 0)}
    </span>

  )

}
