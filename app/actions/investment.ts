'use server'

import { revalidatePath } from 'next/cache'

import { getSupabase } from '@/lib/supabase'

import { assertMoney } from '@/lib/validate'

import type {
  Investment,
  InvestmentCurrency,
  InvestmentKind
} from '@/lib/types'

const KINDS: InvestmentKind[] = [
  'renda_fixa',
  'renda_variavel',
  'fundos',
  'cripto',
  'internacional',
  'outros'
]

const CURRENCIES: InvestmentCurrency[] = ['BRL', 'USD']

const RATE_TYPES = ['cdi', 'aa', 'ipca', 'selic', 'outro']

export type InvestmentInput = {

  platform: string

  kind: InvestmentKind

  subtype?: string | null

  currency: InvestmentCurrency

  value: number

  rate?: number | null

  rate_type?: string | null

  purchase_date?: string | null

  maturity_date?: string | null

  notes?: string | null

}

// Regras básicas de consistência, aplicadas em criar E editar.
function validate(input: InvestmentInput) {

  if (!input.platform.trim()) {

    throw new Error('Informe a plataforma.')

  }

  if (!KINDS.includes(input.kind)) {

    throw new Error('Tipo de investimento inválido.')

  }

  if (!CURRENCIES.includes(input.currency)) {

    throw new Error('Moeda inválida.')

  }

  assertMoney(input.value, 'Valor')

  if (input.rate !== null && input.rate !== undefined) {

    if (!Number.isFinite(input.rate) || input.rate < 0) {

      throw new Error('Taxa inválida — use um número maior ou igual a zero.')

    }

    if (input.rate_type && !RATE_TYPES.includes(input.rate_type)) {

      throw new Error('Tipo de taxa inválido.')

    }

  }

  // Datas chegam como 'YYYY-MM-DD' — comparação lexicográfica é segura.
  if (
    input.purchase_date &&
    input.maturity_date &&
    input.purchase_date > input.maturity_date
  ) {

    throw new Error('A data da aplicação não pode ser depois do vencimento.')

  }

}

function toRow(input: InvestmentInput) {

  return {
    platform: input.platform.trim(),
    kind: input.kind,
    subtype: input.subtype?.trim() || null,
    currency: input.currency,
    value: input.value,
    rate: input.rate ?? null,
    rate_type: input.rate !== null && input.rate !== undefined
      ? (input.rate_type ?? null)
      : null,
    purchase_date: input.purchase_date || null,
    maturity_date: input.maturity_date || null,
    notes: input.notes?.trim() || null

  }

}

function isMissingInvestmentsTable(err: { message: string } | null): boolean {

  if (!err) {

    return false

  }

  return /investments/.test(err.message)

}

export async function listInvestments(): Promise<{
  items: Investment[]
  ready: boolean
}> {

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {

    if (isMissingInvestmentsTable(error)) {

      return { items: [], ready: false }

    }

    throw new Error(error.message)

  }

  return { items: (data ?? []) as Investment[], ready: true }

}

export async function createInvestment(input: InvestmentInput) {

  validate(input)

  const supabase = await getSupabase()

  const { error } = await supabase.from('investments').insert(toRow(input))

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}

export async function updateInvestment(id: string, input: InvestmentInput) {

  validate(input)

  const supabase = await getSupabase()

  const { error } = await supabase
    .from('investments')
    .update(toRow(input))
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}

export async function deleteInvestment(id: string) {

  const supabase = await getSupabase()

  const { error } = await supabase.from('investments').delete().eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}
