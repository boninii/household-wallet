import { describe, expect, it } from 'vitest'

import {
  buildAutofillRows,
  findPreviousBudget,
  isRecurringActiveFor,
  latestValueByRecurring,
  monthsBetween,
  pickApplicableRecurring
} from '@/lib/autofill'

import type { RecurringExpense } from '@/lib/types'

// O autofill decide QUAIS despesas nascem no mes novo e COM QUAL VALOR.
// Errar aqui e dinheiro lancado dobrado, faltando, ou com valor velho.

function rec(over: Partial<RecurringExpense> = {}): RecurringExpense {

  return {
    id: 'r1',
    category: 'custos_fixos',
    name: 'Aluguel',
    value: 1500,
    active: true,
    start_month: null,
    start_year: null,
    duration_months: null,
    payment_method: null,
    created_at: new Date(0).toISOString(),
    ...over

  }

}

describe('monthsBetween', () => {

  it('conta meses cruzando anos, nos dois sentidos', () => {

    expect(monthsBetween(11, 2025, 2, 2026)).toBe(3)

    expect(monthsBetween(2, 2026, 11, 2025)).toBe(-3)

    expect(monthsBetween(6, 2026, 6, 2026)).toBe(0)

  })

})

describe('isRecurringActiveFor', () => {

  it('inativo nunca entra', () => {

    expect(isRecurringActiveFor(rec({ active: false }), 8, 2026)).toBe(false)

  })

  it('sem data de inicio, entra em qualquer mes', () => {

    expect(isRecurringActiveFor(rec(), 1, 2000)).toBe(true)

  })

  it('nao entra antes do inicio; entra a partir dele', () => {

    const r = rec({ start_month: 8, start_year: 2026 })

    expect(isRecurringActiveFor(r, 7, 2026)).toBe(false)

    expect(isRecurringActiveFor(r, 8, 2026)).toBe(true)

    expect(isRecurringActiveFor(r, 1, 2027)).toBe(true)

  })

  it('duracao de N parcelas termina EXATAMENTE na parcela N (borda)', () => {

    // 3 parcelas a partir de ago/2026: ago, set, out. Nov ja nao entra.
    const r = rec({ start_month: 8, start_year: 2026, duration_months: 3 })

    expect(isRecurringActiveFor(r, 10, 2026)).toBe(true)

    expect(isRecurringActiveFor(r, 11, 2026)).toBe(false)

  })

  it('duracao null significa sem fim', () => {

    const r = rec({ start_month: 1, start_year: 2020, duration_months: null })

    expect(isRecurringActiveFor(r, 12, 2099)).toBe(true)

  })

})

describe('findPreviousBudget', () => {

  const budgets = [
    { id: 'a', month: 6, year: 2026 },
    { id: 'b', month: 12, year: 2025 },
    { id: 'c', month: 7, year: 2026 }

  ]

  it('acha o mes anterior mais proximo, independente da ordem da lista', () => {

    expect(findPreviousBudget(budgets, 8, 2026)?.id).toBe('c')

    expect(findPreviousBudget([...budgets].reverse(), 8, 2026)?.id).toBe('c')

  })

  it('o proprio mes nao conta como anterior', () => {

    expect(findPreviousBudget(budgets, 7, 2026)?.id).toBe('a')

  })

  it('cruza o ano quando preciso e devolve null sem historico', () => {

    expect(findPreviousBudget(budgets, 1, 2026)?.id).toBe('b')

    expect(findPreviousBudget([], 8, 2026)).toBeNull()

    expect(findPreviousBudget(budgets, 1, 2025)).toBeNull()

  })

})

describe('pickApplicableRecurring', () => {

  it('exclui os ja lancados no mes (nao duplica em recarga)', () => {

    const items = [rec({ id: 'r1' }), rec({ id: 'r2', name: 'Internet' })]

    const picked = pickApplicableRecurring(items, new Set(['r1']), 8, 2026)

    expect(picked.map((r) => r.id)).toEqual(['r2'])

  })

  it('combina janela temporal com exclusao', () => {

    const items = [
      rec({ id: 'ativo' }),
      rec({ id: 'futuro', start_month: 9, start_year: 2026 }),
      rec({ id: 'inativo', active: false })

    ]

    const picked = pickApplicableRecurring(items, new Set(), 8, 2026)

    expect(picked.map((r) => r.id)).toEqual(['ativo'])

  })

})

describe('latestValueByRecurring', () => {

  it('em lista ascendente, o ultimo lancamento vence', () => {

    const map = latestValueByRecurring([
      { recurring_id: 'r1', value: 100 },
      { recurring_id: 'r2', value: '75.5' },
      { recurring_id: 'r1', value: 120 }

    ])

    expect(map.get('r1')).toBe(120)

    expect(map.get('r2')).toBe(75.5)

  })

})

describe('buildAutofillRows', () => {

  it('herda o valor do mes anterior quando existe; senao usa o valor base', () => {

    const applicable = [rec({ id: 'r1', value: 1500 }), rec({ id: 'r2', value: 99.9, name: 'Internet' })]

    const rows = buildAutofillRows(
      applicable,
      new Map([['r1', 1650]]),
      'budget-1',
      'wallet-1'

    )

    expect(rows).toEqual([
      {
        budget_id: 'budget-1',
        category: 'custos_fixos',
        name: 'Aluguel',
        value: 1650,
        recurring_id: 'r1',
        payment_method: null,
        user_id: 'wallet-1'

      },
      {
        budget_id: 'budget-1',
        category: 'custos_fixos',
        name: 'Internet',
        value: 99.9,
        recurring_id: 'r2',
        payment_method: null,
        user_id: 'wallet-1'

      }

    ])

  })

  it('preserva a forma de pagamento do recorrente', () => {

    const rows = buildAutofillRows(
      [rec({ payment_method: 'pix' })],
      new Map(),
      'b',
      'w'

    )

    expect(rows[0].payment_method).toBe('pix')

  })

})
