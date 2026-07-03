type Props = {

  className?: string

}

// Carteira em line-art. Herda a cor via currentColor (fica escura sobre o tile ambar).
export function BrandMark({ className }: Props) {

  return (
    <svg
      viewBox='0 0 32 32'
      fill='none'
      stroke='currentColor'
      strokeWidth={2.4}
      strokeLinejoin='round'
      strokeLinecap='round'
      className={className}
      xmlns='http://www.w3.org/2000/svg'
    >

      <rect x='4.5' y='8' width='23' height='17' rx='4' />

      <path d='M4.5 14 H27.5' />

      <circle cx='22' cy='19.5' r='1.5' fill='currentColor' stroke='none' />

    </svg>

  )

}
