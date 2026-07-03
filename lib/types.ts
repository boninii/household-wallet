export type Category = {

  id: string

  slug: string

  label: string

  color: string

  sort_order: number

  is_default: boolean

  is_saving: boolean

  archived_at: string | null

  created_at: string

}

// Define a cor do "Utilizado" baseado se a categoria e de saving (investir mais e bom)
// ou de spending (gastar menos e bom).

export function getProgressColor(used_pct: number, is_saving: boolean): string {

  if (is_saving) {

    if (used_pct >= 100) {

      return 'text-positive-soft'

    }

    if (used_pct >= 50) {

      return 'text-brand'

    }

    return 'text-negative'

  }

  if (used_pct > 100) {

    return 'text-negative'

  }

  if (used_pct > 80) {

    return 'text-brand'

  }

  return 'text-positive-soft'

}

export type CategoryAllocation = {

  budget_id: string

  category_id: string

  pct: number

}

export type CategoryWithPct = Category & {

  pct: number

}

export type MonthlyBudget = {

  id: string

  month: number

  year: number

  income: number

  created_at: string

  updated_at: string

}

export type Expense = {

  id: string

  budget_id: string

  category: string

  name: string

  value: number

  notes: string | null

  recurring_id: string | null

  payment_method: string | null

  created_at: string

}

export type RecurringExpense = {

  id: string

  category: string

  name: string

  value: number

  active: boolean

  start_month: number | null

  start_year: number | null

  duration_months: number | null

  payment_method: string | null

  created_at: string

}

export type Financing = {

  id: string

  name: string

  category: string

  total_parcels: number

  parcel_value: number

  paid_parcels: number

  interest_rate: number | null

  start_month: number

  start_year: number

  down_payment: number

  total_value: number | null

  notes: string | null

  created_at: string

}

export type FinancingPayment = {

  id: string

  financing_id: string

  budget_id: string

  parcel_number: number

  value: number

  expense_id: string | null

  created_at: string

}

export type InvestmentKind =
  | 'renda_fixa'
  | 'renda_variavel'
  | 'fundos'
  | 'cripto'
  | 'internacional'
  | 'outros'

export type InvestmentCurrency = 'BRL' | 'USD'

export type Investment = {

  id: string

  platform: string

  kind: InvestmentKind

  subtype: string | null

  currency: InvestmentCurrency

  value: number

  rate: number | null

  rate_type: string | null

  purchase_date: string | null

  maturity_date: string | null

  notes: string | null

  created_at: string

  updated_at: string

}

export type RateType = 'cdi' | 'aa' | 'ipca' | 'selic' | 'outro'

export type RateTypeMeta = {

  key: RateType

  label: string

  format: (rate: number) => string

}

export const RATE_TYPES: RateTypeMeta[] = [

  { key: 'cdi',   label: '% CDI',   format: (r) => `${r.toFixed(2).replace('.', ',')}% CDI` },

  { key: 'aa',    label: '% a.a.',  format: (r) => `${r.toFixed(2).replace('.', ',')}% a.a.` },

  { key: 'ipca',  label: 'IPCA +',  format: (r) => `IPCA + ${r.toFixed(2).replace('.', ',')}%` },

  { key: 'selic', label: 'Selic +', format: (r) => `Selic + ${r.toFixed(2).replace('.', ',')}%` },

  { key: 'outro', label: 'Outro',   format: (r) => `${r.toFixed(2).replace('.', ',')}%` }

]

export function formatRate(rate: number | null, type: string | null): string {

  if (rate === null || rate === undefined) {

    return '—'

  }

  const meta = RATE_TYPES.find((t) => t.key === type)

  if (!meta) {

    return `${Number(rate).toFixed(2).replace('.', ',')}%`

  }

  return meta.format(Number(rate))

}
