'use server'

import { revalidatePath } from 'next/cache'

import { getSupabase } from '@/lib/supabase'

import type {
  Investment,
  InvestmentCurrency,
  InvestmentKind
} from '@/lib/types'

export type CreateInvestmentInput = {

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

  const supabase = getSupabase()

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

export async function createInvestment(input: CreateInvestmentInput) {

  if (!input.platform.trim()) {

    throw new Error('Informe a plataforma.')

  }

  if (!(input.value >= 0)) {

    throw new Error('Valor invalido.')

  }

  const supabase = getSupabase()

  const { error } = await supabase.from('investments').insert({
    platform: input.platform.trim(),
    kind: input.kind,
    subtype: input.subtype?.trim() || null,
    currency: input.currency,
    value: input.value,
    rate: input.rate ?? null,
    rate_type: input.rate_type ?? null,
    purchase_date: input.purchase_date ?? null,
    maturity_date: input.maturity_date ?? null,
    notes: input.notes?.trim() || null

  })

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}

export async function updateInvestmentValue(id: string, value: number) {

  if (!(value >= 0)) {

    throw new Error('Valor invalido.')

  }

  const supabase = getSupabase()

  const { error } = await supabase
    .from('investments')
    .update({ value })
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}

export async function deleteInvestment(id: string) {

  const supabase = getSupabase()

  const { error } = await supabase.from('investments').delete().eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/investimentos')

}
