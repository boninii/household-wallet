import { describe, expect, it } from 'vitest'

import { RATE_TYPES, formatRate, getProgressColor } from '@/lib/types'

// formatRate aparece na listagem e no link publico; getProgressColor decide a
// cor semantica (bom/atencao/ruim) das metas — com sentido INVERTIDO para
// categorias de investimento (gastar mais = bom).

describe('formatRate', () => {

  it('taxa ausente vira travessao', () => {

    expect(formatRate(null, 'cdi')).toBe('—')

    expect(formatRate(null, null)).toBe('—')

  })

  it('formata cada tipo no seu padrao de mercado', () => {

    expect(formatRate(100, 'cdi')).toBe('100,00% CDI')

    expect(formatRate(12.5, 'aa')).toBe('12,50% a.a.')

    expect(formatRate(6, 'ipca')).toBe('IPCA + 6,00%')

    expect(formatRate(2, 'selic')).toBe('Selic + 2,00%')

    expect(formatRate(1.234, 'outro')).toBe('1,23%')

  })

  it('tipo desconhecido ou nulo cai no formato percentual generico', () => {

    expect(formatRate(9.9, 'inexistente')).toBe('9,90%')

    expect(formatRate(9.9, null)).toBe('9,90%')

  })

  it('a lista de tipos cobre exatamente os aceitos pelo banco', () => {

    expect(RATE_TYPES.map((t) => t.key)).toEqual(['cdi', 'aa', 'ipca', 'selic', 'outro'])

  })

})

describe('getProgressColor — categoria de GASTO', () => {

  it('ate 80% e positivo; acima de 80 vira atencao; acima de 100 vira negativo', () => {

    expect(getProgressColor(0, false)).toBe('text-positive-soft')

    expect(getProgressColor(80, false)).toBe('text-positive-soft')

    expect(getProgressColor(80.1, false)).toBe('text-brand')

    expect(getProgressColor(100, false)).toBe('text-brand')

    expect(getProgressColor(100.1, false)).toBe('text-negative')

  })

})

describe('getProgressColor — categoria de INVESTIMENTO (sentido invertido)', () => {

  it('bater a meta e BOM; ficar abaixo da metade e ruim', () => {

    expect(getProgressColor(100, true)).toBe('text-positive-soft')

    expect(getProgressColor(120, true)).toBe('text-positive-soft')

    expect(getProgressColor(50, true)).toBe('text-brand')

    expect(getProgressColor(99.9, true)).toBe('text-brand')

    expect(getProgressColor(49.9, true)).toBe('text-negative')

    expect(getProgressColor(0, true)).toBe('text-negative')

  })

})
