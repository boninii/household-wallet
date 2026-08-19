import type { RecurringExpense } from './types'

// Planejador PURO do autofill de recorrentes — a logica temporal (o que entra
// no mes, com qual valor) separada das queries. app/actions/budget.ts busca os
// dados e delega as decisoes para ca, o que torna cada regra testavel sem
// banco. Comportamento identico ao que vivia inline na action.

export function monthsBetween(
  from_month: number,
  from_year: number,
  to_month: number,
  to_year: number
): number {

  return (to_year - from_year) * 12 + (to_month - from_month)

}

// Um recorrente vale para o mes quando esta ativo e, se tiver inicio definido,
// o mes esta dentro da janela [inicio, inicio + duracao). Duracao null = sem fim.
export function isRecurringActiveFor(
  r: RecurringExpense,
  month: number,
  year: number
): boolean {

  if (!r.active) {

    return false

  }

  if (r.start_month && r.start_year) {

    const delta = monthsBetween(r.start_month, r.start_year, month, year)

    if (delta < 0) {

      return false

    }

    if (r.duration_months !== null && delta >= r.duration_months) {

      return false

    }

  }

  return true

}

export type BudgetRef = {

  id: string

  month: number

  year: number

}

// Orcamento mais recente ANTERIOR ao mes corrente (nunca o proprio). Ordena
// internamente para nao depender da ordem da query.
export function findPreviousBudget(
  budgets: BudgetRef[],
  month: number,
  year: number
): BudgetRef | null {

  const older = budgets
    .filter((b) => b.year < year || (b.year === year && b.month < month))
    .sort((a, b) => (b.year - a.year) || (b.month - a.month))

  return older[0] ?? null

}

// Recorrentes que devem virar despesa neste mes: ativos na janela e ainda nao
// lancados (o vinculo recurring_id evita duplicar em recargas).
export function pickApplicableRecurring(
  items: RecurringExpense[],
  existing_ids: Set<string>,
  month: number,
  year: number
): RecurringExpense[] {

  return items.filter(
    (r) => !existing_ids.has(r.id) && isRecurringActiveFor(r, month, year)

  )

}

// Linhas do mes anterior chegam em ordem ASCENDENTE de criacao — a ultima
// ocorrencia de cada recorrente e a que vale.
export function latestValueByRecurring(
  rows: Array<{ recurring_id: string; value: number | string }>
): Map<string, number> {

  const map = new Map<string, number>()

  for (const row of rows) {

    map.set(row.recurring_id, Number(row.value))

  }

  return map

}

export type AutofillRow = {

  budget_id: string

  category: string

  name: string

  value: number

  recurring_id: string

  payment_method: string | null

  user_id: string

}

// Monta as despesas a inserir: herda o ultimo valor do mes anterior quando
// existir; senao usa o valor base do recorrente.
export function buildAutofillRows(
  applicable: RecurringExpense[],
  prev_values: Map<string, number>,
  budget_id: string,
  wallet_id: string
): AutofillRow[] {

  return applicable.map((r) => ({
    budget_id,
    category: r.category,
    name: r.name,
    value: prev_values.get(r.id) ?? Number(r.value),
    recurring_id: r.id,
    payment_method: r.payment_method ?? null,
    user_id: wallet_id

  }))

}
