type Props = {

  title: string

  subtitle?: string

  action?: React.ReactNode

}

export function PageHeader({ title, subtitle, action }: Props) {

  return (
    <header className='flex flex-wrap items-end justify-between gap-4'>

      <div className='max-w-2xl'>

        <h1 className='font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.015em] text-text-50 sm:text-[34px]'>
          {title}
        </h1>

        {subtitle && (

          <p className='mt-2 text-sm leading-relaxed text-text-300'>{subtitle}</p>

        )}

      </div>

      {action && <div className='shrink-0'>{action}</div>}

    </header>

  )

}
