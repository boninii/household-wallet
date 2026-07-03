import * as React from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {

  return (
    <div
      className={cn(
        'card-surface p-6',
        className

      )}
      {...props}
    />

  )

}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {

  return <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props} />

}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {

  return (
    <h3
      className={cn('section-title text-xl', className)}
      {...props}
    />

  )

}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {

  return <div className={cn('text-sm text-text-100', className)} {...props} />

}
