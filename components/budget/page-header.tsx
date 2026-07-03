type Props = {

  title: string

  subtitle?: string

  action?: React.ReactNode

}

export function PageHeader({ title, subtitle, action }: Props) {

  return (
    <header className='flex flex-wrap items-end justify-between gap-4'>

      <div>

        <h1 className='font-display text-5xl text-text-50'>
          {title}
        </h1>

        {subtitle && (

          <p className='mt-3 max-w-2xl text-sm text-text-300'>{subtitle}</p>

        )}

      </div>

      {action && <div className='shrink-0'>{action}</div>}

    </header>

  )

}
