'use server'

import { revalidatePath } from 'next/cache'

import { getSupabase } from '@/lib/supabase'

import { getOrCreateBudget } from './budget'

import type {
  Financing,
  FinancingPayment
} from '@/lib/types'

export type CreateFinancingInput = {

  name: string

  category: string

  total_parcels: number

  parcel_value: number

  start_month: number

  start_year: number

  interest_rate?: number | null

  down_payment?: number

  total_value?: number | null

  notes?: string | null

}

function isMissingFinancingTable(err: { message: string } | null): boolean {

  if (!err) {

    return false

  }

  return /financings|financing_payments/.test(err.message)

}

export async function listFinancings(): Promise<{
  items: Financing[]
  ready: boolean
}> {

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('financings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {

    if (isMissingFinancingTable(error)) {

      return { items: [], ready: false }

    }

    throw new Error(error.message)

  }

  return { items: (data ?? []) as Financing[], ready: true }

}

export async function listFinancingPayments(
  financing_id: string
): Promise<FinancingPayment[]> {

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('financing_payments')
    .select('*')
    .eq('financing_id', financing_id)
    .order('parcel_number', { ascending: true })

  if (error) {

    throw new Error(error.message)

  }

  return (data ?? []) as FinancingPayment[]

}

export async function createFinancing(input: CreateFinancingInput) {

  if (!input.name.trim()) {

    throw new Error('Informe um nome.')

  }

  if (!(input.total_parcels > 0)) {

    throw new Error('Quantidade de parcelas inválida.')

  }

  if (!(input.parcel_value >= 0)) {

    throw new Error('Valor da parcela inválido.')

  }

  const supabase = getSupabase()

  const { error } = await supabase.from('financings').insert({
    name: input.name.trim(),
    category: input.category,
    total_parcels: input.total_parcels,
    parcel_value: input.parcel_value,
    start_month: input.start_month,
    start_year: input.start_year,
    interest_rate: input.interest_rate ?? null,
    down_payment: input.down_payment ?? 0,
    total_value: input.total_value ?? null,
    notes: input.notes ?? null

  })

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/financiamentos')

}

export async function deleteFinancing(id: string) {

  const supabase = getSupabase()

  const { error } = await supabase.from('financings').delete().eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/financiamentos')

}

export async function payParcel(
  financing_id: string,
  month: number,
  year: number,
  custom_value?: number
) {

  const supabase = getSupabase()

  const fin = await supabase
    .from('financings')
    .select('*')
    .eq('id', financing_id)
    .single()

  if (fin.error) {

    throw new Error(fin.error.message)

  }

  const financing = fin.data as Financing

  if (financing.paid_parcels >= financing.total_parcels) {

    throw new Error('Financiamento já foi quitado.')

  }

  const parcel_number = financing.paid_parcels + 1

  const value =
    typeof custom_value === 'number' && custom_value > 0
      ? custom_value
      : Number(financing.parcel_value)

  const budget = await getOrCreateBudget(month, year)

  const expense = await supabase
    .from('expenses')
    .insert({
      budget_id: budget.id,
      category: financing.category,
      name: `${financing.name} (parcela ${parcel_number}/${financing.total_parcels})`,
      value

    })
    .select('id')
    .single()

  if (expense.error) {

    throw new Error(expense.error.message)

  }

  const payment = await supabase.from('financing_payments').insert({
    financing_id,
    budget_id: budget.id,
    parcel_number,
    value,
    expense_id: expense.data.id

  })

  if (payment.error) {

    throw new Error(payment.error.message)

  }

  await supabase
    .from('financings')
    .update({ paid_parcels: parcel_number })
    .eq('id', financing_id)

  revalidatePath('/financiamentos')

  revalidatePath('/', 'layout')

}

export async function undoLastParcel(financing_id: string) {

  const supabase = getSupabase()

  const fin = await supabase
    .from('financings')
    .select('*')
    .eq('id', financing_id)
    .single()

  if (fin.error) {

    throw new Error(fin.error.message)

  }

  const financing = fin.data as Financing

  if (financing.paid_parcels === 0) {

    return

  }

  const last_parcel = financing.paid_parcels

  const last_payment = await supabase
    .from('financing_payments')
    .select('id,expense_id')
    .eq('financing_id', financing_id)
    .eq('parcel_number', last_parcel)
    .maybeSingle()

  if (last_payment.data?.expense_id) {

    await supabase.from('expenses').delete().eq('id', last_payment.data.expense_id)

  }

  if (last_payment.data?.id) {

    await supabase
      .from('financing_payments')
      .delete()
      .eq('id', last_payment.data.id)

  }

  await supabase
    .from('financings')
    .update({ paid_parcels: last_parcel - 1 })
    .eq('id', financing_id)

  revalidatePath('/financiamentos')

  revalidatePath('/', 'layout')

}
