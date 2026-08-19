import { describe, expect, it } from 'vitest'

import {
  cn,
  formatBRL,
  formatBRLPlain,
  formatDateBR,
  monthLabel,
  parseBRL,
  shiftMonth
} from '@/lib/utils'

// parseBRL converte texto digitado em dinheiro — errar aqui e gravar valor
// financeiro errado. Os formatadores usam Intl pt-BR (separador de milhar '.'
// e decimal ','; o espaco do R$ e um espaco nao separavel).

describe('parseBRL', () => {

  it('interpreta o formato brasileiro completo', () => {

    expect(parseBRL('1.234,56')).toBe(1234.56)

    expect(parseBRL('R$ 1.234,56')).toBe(1234.56)

    expect(parseBRL('10,5')).toBe(10.5)

  })

  it('ponto e separador de MILHAR, nunca decimal', () => {

    expect(parseBRL('1.000')).toBe(1000)

    expect(parseBRL('1.000.000')).toBe(1000000)

  })

  it('entrada vazia ou sem numeros vira 0', () => {

    expect(parseBRL('')).toBe(0)

    expect(parseBRL('abc')).toBe(0)

    expect(parseBRL('R$ ')).toBe(0)

  })

  it('preserva negativo (quem barra negativo e o assertMoney, no servidor)', () => {

    expect(parseBRL('-100')).toBe(-100)

  })

  it('entrada que vira numero invalido cai no fallback 0 (ex: duas virgulas)', () => {

    expect(parseBRL('1,2,3')).toBe(0)

    expect(parseBRL('--5')).toBe(0)

  })

  it('e o inverso de formatBRLPlain (ida e volta sem perda)', () => {

    for (const v of [0, 0.05, 1, 999.99, 1234.56, 999999999.99]) {

      expect(parseBRL(formatBRLPlain(v))).toBe(v)

    }

  })

})

describe('formatBRL / formatBRLPlain', () => {

  it('formata com milhar e decimal brasileiros', () => {

    expect(formatBRLPlain(1234.5)).toBe('1.234,50')

    expect(formatBRLPlain(0)).toBe('0,00')

  })

  it('formatBRL prefixa R$ (com espaco nao separavel do Intl)', () => {

    const s = formatBRL(1234.56)

    expect(s.startsWith('R$')).toBe(true)

    expect(s.endsWith('1.234,56')).toBe(true)

  })

  it('null/undefined/NaN degradam para 0, nao explodem', () => {

    expect(formatBRL(Number.NaN)).toBe(formatBRL(0))

    expect(formatBRLPlain(undefined as unknown as number)).toBe('0,00')

  })

})

describe('shiftMonth', () => {

  it('vira o ano para tras e para frente', () => {

    expect(shiftMonth(1, 2026, -1)).toEqual({ month: 12, year: 2025 })

    expect(shiftMonth(12, 2025, 1)).toEqual({ month: 1, year: 2026 })

  })

  it('saltos grandes cruzam varios anos', () => {

    expect(shiftMonth(6, 2026, 18)).toEqual({ month: 12, year: 2027 })

    expect(shiftMonth(1, 2026, -13)).toEqual({ month: 12, year: 2024 })

  })

  it('delta zero e identidade', () => {

    expect(shiftMonth(7, 2026, 0)).toEqual({ month: 7, year: 2026 })

  })

})

describe('monthLabel', () => {

  it('nomeia o mes em portugues', () => {

    expect(monthLabel(1, 2026)).toBe('Janeiro/2026')

    expect(monthLabel(12, 2025)).toBe('Dezembro/2025')

  })

  it('mes invalido degrada para nome vazio (nao explode)', () => {

    expect(monthLabel(13, 2026)).toBe('/2026')

  })

})

describe('formatDateBR', () => {

  it('formata ISO como dd/mm/aaaa sem passar por Date (sem shift de fuso)', () => {

    expect(formatDateBR('2026-08-01')).toBe('01/08/2026')

    expect(formatDateBR('2026-12-31T23:59:59Z')).toBe('31/12/2026')

  })

  it('nulo vira travessao', () => {

    expect(formatDateBR(null)).toBe('—')

  })

})

describe('cn', () => {

  it('resolve conflitos do tailwind mantendo a ultima classe', () => {

    expect(cn('p-2', 'p-4')).toBe('p-4')

    expect(cn('text-red-500', false && 'hidden', 'text-blue-500')).toBe('text-blue-500')

  })

})
