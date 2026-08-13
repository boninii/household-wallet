'use client'

import { useMemo, useState } from 'react'

// Donut SVG puro — substitui o recharts (~100kB por rota) nos 3 gráficos do
// app, que são todos o mesmo anel de categorias. Renderiza paths de setores
// anulares; hover mostra um rótulo flutuante quando `format` é passado.

export type DonutDatum = {

  name: string

  value: number

  color: string

}

type Props = {

  data: DonutDatum[]

  // Raios em unidades do viewBox (0..100). O SVG escala pro tamanho do pai.
  inner_radius?: number

  outer_radius?: number

  gap_deg?: number

  // Formata o valor no rótulo de hover. Sem format, não há tooltip.
  format?: (value: number) => string

  className?: string

}

const RAD = Math.PI / 180

function point(r: number, angle_deg: number): string {

  const x = 100 + r * Math.cos(angle_deg * RAD)

  const y = 100 + r * Math.sin(angle_deg * RAD)

  return `${x.toFixed(3)} ${y.toFixed(3)}`

}

function sectorPath(a0: number, a1: number, r_in: number, r_out: number): string {

  const large = a1 - a0 > 180 ? 1 : 0

  return [
    `M ${point(r_out, a0)}`,
    `A ${r_out} ${r_out} 0 ${large} 1 ${point(r_out, a1)}`,
    `L ${point(r_in, a1)}`,
    `A ${r_in} ${r_in} 0 ${large} 0 ${point(r_in, a0)}`,
    'Z'

  ].join(' ')

}

export function Donut({
  data,
  inner_radius = 62,
  outer_radius = 96,
  gap_deg = 2,
  format,
  className
}: Props) {

  const [active, setActive] = useState<number | null>(null)

  const segments = useMemo(() => {

    const visible = data.filter((d) => d.value > 0)

    const total = visible.reduce((acc, d) => acc + d.value, 0)

    if (total <= 0) {

      return []

    }

    // Com 1 segmento não há o que separar; gap só entre 2+.
    const gap = visible.length > 1 ? gap_deg : 0

    let cursor = -90

    return visible.map((d) => {

      const sweep = (d.value / total) * 360

      const a0 = cursor + gap / 2

      const a1 = cursor + sweep - gap / 2

      cursor += sweep

      // Clamps: arco nunca colapsa (mín. 0.4°) nem fecha 360° exatos — um
      // arco SVG com início == fim não renderiza nada.
      const a1_safe = Math.min(Math.max(a1, a0 + 0.4), a0 + 359.6)

      return { ...d, a0, a1: a1_safe }

    })
  }, [data, gap_deg])

  const active_seg = active !== null ? segments[active] : null

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>

      <svg
        viewBox='0 0 200 200'
        className='h-full w-full'
        role='img'
        aria-label='Distribuição por categoria'
      >

        {segments.length === 0 && (

          <circle
            cx='100'
            cy='100'
            r={(inner_radius + outer_radius) / 2}
            fill='none'
            strokeWidth={outer_radius - inner_radius}
            className='stroke-bg-800'
          />

        )}

        {segments.map((s, i) => (

          <path
            key={s.name}
            d={sectorPath(s.a0, s.a1, inner_radius, outer_radius)}
            fill={s.color}
            opacity={active === null || active === i ? 1 : 0.35}
            onMouseEnter={format ? () => setActive(i) : undefined}
            onMouseLeave={format ? () => setActive(null) : undefined}
            style={{ transition: 'opacity 120ms ease' }}
          >
            {format && <title>{`${s.name}: ${format(s.value)}`}</title>}
          </path>

        ))}

      </svg>

      {format && active_seg && (

        <div className='pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center'>

          <p className='max-w-[110px] truncate text-[11px] text-text-300'>{active_seg.name}</p>

          <p className='text-sm font-semibold tabular-nums text-text-50'>
            {format(active_seg.value)}
          </p>

        </div>

      )}

    </div>

  )

}
