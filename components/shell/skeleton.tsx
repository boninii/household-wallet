import { cn } from '@/lib/utils'

// Building blocks ------------------------------------------------------------

function Block({ className }: { className?: string }) {

  return <div className={cn('rounded bg-bg-900/60', className)} />

}

function Pulse({ children, className }: { children: React.ReactNode; className?: string }) {

  return (
    <section className={cn('flex animate-pulse flex-col gap-8', className)}>
      {children}
    </section>

  )

}

function Header({ wide = false }: { wide?: boolean }) {

  return (
    <div className='space-y-3'>
      <Block className={cn('h-12 rounded-lg', wide ? 'w-96' : 'w-72')} />
      <Block className='h-4 w-[28rem] bg-bg-900/40' />
    </div>

  )

}

function MonthBar() {

  return (
    <div className='flex items-end gap-6 rounded-2xl bg-bg-900/40 p-5 ring-1 ring-bg-800'>
      <div className='space-y-2'>
        <Block className='h-3 w-32 bg-bg-900/40' />
        <Block className='h-10 w-44 rounded-xl bg-brand/30' />
      </div>
      <div className='space-y-2'>
        <Block className='h-3 w-24 bg-bg-900/40' />
        <Block className='h-10 w-48 rounded-lg' />
      </div>
    </div>

  )

}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {

  return (
    <div className={cn('card-surface p-6', className)}>{children}</div>

  )

}

// Skeleton 1: Dashboard (/) --------------------------------------------------

export function DashboardSkeleton() {

  return (
    <Pulse>

      <Header wide />

      <MonthBar />

      <div className='grid gap-6 xl:grid-cols-[1fr_1.4fr_0.9fr]'>

        {/* Donut */}
        <Card>
          <Block className='mb-6 h-6 w-40 bg-bg-900' />
          <div className='flex items-center justify-center py-4'>
            <div className='relative h-[180px] w-[180px]'>
              <div className='absolute inset-0 rounded-full bg-bg-900/60' />
              <div className='absolute inset-8 rounded-full bg-bg-900' />
            </div>
          </div>
          <Block className='mx-auto mt-4 h-5 w-32 bg-bg-900' />
          <ul className='mt-5 grid grid-cols-2 gap-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className='flex items-center gap-2'>
                <Block className='h-2.5 w-2.5 rounded-full' />
                <Block className='h-3 flex-1' />
              </li>

            ))}
          </ul>
        </Card>

        {/* Summary table */}
        <Card>
          <Block className='mb-6 h-6 w-48 bg-bg-900' />
          <div className='space-y-3'>
            <div className='grid grid-cols-5 gap-3 pb-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Block key={i} className='h-3 bg-bg-900/40' />

              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='grid grid-cols-5 gap-3 py-2'>
                <Block className='h-4' />
                <Block className='h-4' />
                <Block className='h-4' />
                <Block className='h-4' />
                <Block className='h-4' />
              </div>

            ))}
          </div>
          <div className='mt-6 grid grid-cols-3 gap-6 border-t border-dashed border-bg-700/40 pt-5'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Block className='h-7 w-32 bg-bg-900' />
                <Block className='h-3 w-20 bg-bg-900/40' />
              </div>

            ))}
          </div>
        </Card>

        {/* Goals */}
        <Card>
          <Block className='mb-5 h-6 w-44 bg-bg-900' />
          <ul className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Block className='h-2.5 w-2.5 rounded-full' />
                  <Block className='h-4 w-32' />
                </div>
                <Block className='h-4 w-10' />
              </li>

            ))}
          </ul>
          <Block className='mt-6 ml-auto h-8 w-32 rounded-lg' />
        </Card>

      </div>

    </Pulse>

  )

}

// Skeleton 2: Despesas (/despesas) -------------------------------------------

export function DespesasSkeleton() {

  return (
    <Pulse>

      <Header />

      <MonthBar />

      {/* Pills */}
      <div className='flex flex-wrap items-center gap-2'>
        <Block className='h-9 w-28 rounded-full bg-brand/30' />
        <Block className='h-5 w-px bg-bg-700' />
        {Array.from({ length: 5 }).map((_, i) => (
          <Block key={i} className='h-9 w-32 rounded-full' />

        ))}
      </div>

      {/* Banner Resumo */}
      <Card>
        <div className='mb-5 flex items-center justify-between'>
          <Block className='h-5 w-36 bg-bg-900' />
          <Block className='h-3 w-24 bg-bg-900/40' />
        </div>
        <div className='grid gap-4 sm:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Block className='h-3 w-20 bg-bg-900/40' />
              <Block className='h-8 w-32' />
            </div>

          ))}
        </div>
      </Card>

      {/* Cards por categoria (3) */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Block className='h-3 w-3 rounded-full' />
              <Block className='h-5 w-32 bg-bg-900' />
            </div>
            <div className='space-y-1 text-right'>
              <Block className='ml-auto h-4 w-24' />
              <Block className='ml-auto h-3 w-16 bg-bg-900/40' />
            </div>
          </div>
          <div className='rounded-lg border border-bg-700/50'>
            <ul className='divide-y divide-dashed divide-bg-700/40'>
              {Array.from({ length: 4 }).map((_, j) => (
                <li key={j} className='flex items-center justify-between px-4 py-3'>
                  <Block className='h-4 w-1/2' />
                  <Block className='h-4 w-20' />
                </li>

              ))}
            </ul>
          </div>
        </Card>

      ))}

    </Pulse>

  )

}

// Skeleton 3: Categorias (/categorias) ---------------------------------------

export function CategoriasSkeleton() {

  return (
    <Pulse>

      <Header />

      <MonthBar />

      <div className='grid gap-6 lg:grid-cols-[1fr_1.5fr]'>

        {/* Donut + legendas */}
        <Card>
          <div className='flex flex-col items-center gap-5'>
            <Block className='h-8 w-32 bg-bg-900' />
            <div className='relative h-[220px] w-[220px]'>
              <div className='absolute inset-0 rounded-full bg-bg-900/60' />
              <div className='absolute inset-10 rounded-full bg-bg-900' />
            </div>
            <ul className='w-full space-y-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className='flex items-center gap-2'>
                  <Block className='h-2.5 w-2.5 rounded-full' />
                  <Block className='h-3 flex-1' />
                  <Block className='h-3 w-10' />
                </li>

              ))}
            </ul>
          </div>
        </Card>

        {/* Sliders */}
        <Card>
          <div className='mb-6 flex items-center justify-between'>
            <Block className='h-6 w-40 bg-bg-900' />
            <Block className='h-9 w-36 rounded-full bg-brand/30' />
          </div>
          <ul className='space-y-7'>
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className='space-y-2'>
                <div className='flex items-center gap-3'>
                  <Block className='h-3 w-3 rounded-full' />
                  <Block className='h-4 flex-1' />
                  <Block className='h-4 w-10' />
                  <Block className='h-8 w-8 rounded-lg' />
                  <Block className='h-8 w-8 rounded-lg' />
                </div>
                <Block className='h-1.5 w-full rounded-full' />
                <div className='flex justify-between'>
                  <Block className='h-2 w-6 bg-bg-900/40' />
                  <Block className='h-2 w-10 bg-bg-900/40' />
                </div>
              </li>

            ))}
          </ul>
        </Card>

      </div>

    </Pulse>

  )

}

// Skeleton 4: Financiamentos (/financiamentos) -------------------------------

export function FinanciamentosSkeleton() {

  return (
    <Pulse>

      <div className='flex items-end justify-between gap-4'>
        <div className='space-y-3'>
          <Block className='h-12 w-72 rounded-lg' />
          <Block className='h-4 w-[28rem] bg-bg-900/40' />
        </div>
        <Block className='h-10 w-44 rounded-lg bg-brand/30' />
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Block className='h-3 w-24 bg-bg-900/40' />
            <Block className='mt-2 h-8 w-32' />
          </Card>

        ))}
      </div>

      <Card>
        <Block className='mb-5 h-6 w-40 bg-bg-900' />
        <ul className='space-y-4'>
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i} className='space-y-3 rounded-xl border border-bg-700/40 bg-bg-900/40 p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='space-y-2'>
                  <Block className='h-5 w-40 bg-bg-900' />
                  <Block className='h-3 w-32 bg-bg-900/40' />
                </div>
                <div className='space-y-2 text-right'>
                  <Block className='ml-auto h-6 w-28' />
                  <Block className='ml-auto h-3 w-16 bg-bg-900/40' />
                </div>
              </div>
              <Block className='h-2 w-full rounded-full' />
              <div className='flex items-center justify-between gap-3'>
                <Block className='h-3 w-40 bg-bg-900/40' />
                <div className='flex gap-2'>
                  <Block className='h-8 w-28 rounded-lg' />
                  <Block className='h-8 w-28 rounded-lg bg-brand/30' />
                </div>
              </div>
            </li>

          ))}
        </ul>
      </Card>

    </Pulse>

  )

}

// Skeleton 5: Investimentos (/investimentos) ---------------------------------

export function InvestimentosSkeleton() {

  return (
    <Pulse>

      <div className='flex items-end justify-between gap-4'>
        <div className='space-y-3'>
          <Block className='h-12 w-72 rounded-lg' />
          <Block className='h-4 w-[28rem] bg-bg-900/40' />
        </div>
        <Block className='h-10 w-44 rounded-lg bg-brand/30' />
      </div>

      <div className='grid gap-4 sm:grid-cols-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Block className='h-3 w-28 bg-bg-900/40' />
            <Block className='mt-2 h-8 w-32' />
          </Card>

        ))}
      </div>

      <Card>
        <Block className='mb-5 h-6 w-32 bg-bg-900' />
        <div className='space-y-3'>
          <div className='grid grid-cols-7 gap-3 pb-2'>
            {Array.from({ length: 7 }).map((_, i) => (
              <Block key={i} className='h-3 bg-bg-900/40' />

            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='grid grid-cols-7 gap-3 py-3'>
              {Array.from({ length: 7 }).map((_, j) => (
                <Block key={j} className='h-4' />

              ))}
            </div>

          ))}
        </div>
      </Card>

    </Pulse>

  )

}

// Generic — retro-compat caso algum loading antigo ainda use --------------

export function PageSkeleton() {

  return <DashboardSkeleton />

}
