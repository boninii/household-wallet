'use server'

import { revalidatePath } from 'next/cache'

import { getSupabase } from '@/lib/supabase'

import type {
  Expense,
  MonthlyBudget,
  RecurringExpense
} from '@/lib/types'

export type GoalsPayload = Record<string, number>

// =========================================================================
// BUDGET
// =========================================================================

function hydrateBudget(row: any): MonthlyBudget {

  return {
    id: row.id,
    month: row.month,
    year: row.year,
    income: Number(row.income || 0),
    created_at: row.created_at,
    updated_at: row.updated_at

  }

}

export async function getOrCreateBudget(month: number, year: number): Promise<MonthlyBudget> {

  const supabase = await getSupabase()

  const existing = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (existing.error) {

    throw new Error(existing.error.message)

  }

  if (existing.data) {

    return hydrateBudget(existing.data)

  }

  // Inserta vazio. As alocacoes serao herdadas via getBudgetAllocations.
  const inserted = await supabase
    .from('monthly_budgets')
    .insert({ month, year, income: 0 })
    .select('*')
    .single()

  if (inserted.error) {

    const is_duplicate =
      inserted.error.code === '23505' ||
      /duplicate key/i.test(inserted.error.message)

    if (is_duplicate) {

      const refetch = await supabase
        .from('monthly_budgets')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .single()

      if (refetch.error) {

        throw new Error(refetch.error.message)

      }

      return hydrateBudget(refetch.data)

    }

    throw new Error(inserted.error.message)

  }

  // Herda alocacoes do mes anterior, ou usa defaults se nao existir.
  await seedAllocationsFromPrevious(inserted.data.id)

  // Lanca os recorrentes ativos automaticamente — usuario nao precisa clicar.
  try {

    await autofillForBudget(inserted.data.id)

  } catch (e) {

    // Se algo falhar no autofill (ex: tabela faltando antes de migrations),
    // segue o jogo. O orcamento ja foi criado.

    console.error('autofill silencioso falhou:', e)

  }

  return hydrateBudget(inserted.data)

}

async function seedAllocationsFromPrevious(budget_id: string) {

  const supabase = await getSupabase()

  const previous = await supabase
    .from('monthly_budgets')
    .select('id')
    .neq('id', budget_id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (previous.data) {

    const prev_allocs = await supabase
      .from('category_allocations')
      .select('category_id,pct')
      .eq('budget_id', previous.data.id)

    if (prev_allocs.data && prev_allocs.data.length > 0) {

      const rows = prev_allocs.data.map((a: any) => ({
        budget_id,
        category_id: a.category_id,
        pct: Number(a.pct)

      }))

      await supabase
        .from('category_allocations')
        .upsert(rows, { onConflict: 'budget_id,category_id' })

      return

    }

  }

  // Sem mes anterior: cria alocacoes para todas as categorias com pct=0.
  const cats = await supabase
    .from('categories')
    .select('id')
    .is('archived_at', null)

  if (cats.data && cats.data.length > 0) {

    const rows = cats.data.map((c: any) => ({
      budget_id,
      category_id: c.id,
      pct: 0

    }))

    await supabase
      .from('category_allocations')
      .upsert(rows, { onConflict: 'budget_id,category_id' })

  }

}

export async function getBudgetAllocations(
  budget_id: string
): Promise<Record<string, number>> {

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('category_allocations')
    .select('category_id,pct')
    .eq('budget_id', budget_id)

  if (error) {

    // Sem migration ainda — retorna vazio
    return {}

  }

  const result: Record<string, number> = {}

  for (const a of data ?? []) {

    result[a.category_id] = Number(a.pct)

  }

  return result

}

export async function updateIncome(budget_id: string, income: number) {

  const supabase = await getSupabase()

  const { error } = await supabase
    .from('monthly_budgets')
    .update({ income })
    .eq('id', budget_id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

export async function updateGoals(budget_id: string, goals: GoalsPayload) {

  const total = Object.values(goals).reduce(
    (acc, n) => acc + Number(n || 0),
    0

  )

  if (total > 100.01) {

    throw new Error(`A soma das metas (${total.toFixed(0)}%) excede 100%.`)

  }

  const supabase = await getSupabase()

  const rows = Object.entries(goals).map(([category_id, pct]) => ({
    budget_id,
    category_id,
    pct

  }))

  const { error } = await supabase
    .from('category_allocations')
    .upsert(rows, { onConflict: 'budget_id,category_id' })

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

// =========================================================================
// EXPENSES
// =========================================================================

export async function listExpenses(budget_id: string): Promise<Expense[]> {

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('budget_id', budget_id)
    .order('created_at', { ascending: true })

  if (error) {

    throw new Error(error.message)

  }

  return (data ?? []) as Expense[]

}

export async function addExpense(
  budget_id: string,
  category: string,
  name: string,
  value: number,
  notes?: string | null,
  payment_method?: string | null
): Promise<Expense> {

  if (!name.trim()) {

    throw new Error('Informe um nome para a despesa.')

  }

  if (!(value >= 0)) {

    throw new Error('Valor inválido.')

  }

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      budget_id,
      category,
      name: name.trim(),
      value,
      notes: notes?.trim() || null,
      payment_method: payment_method || null

    })
    .select('*')
    .single()

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

  return data as Expense

}

export type ExpensePatch = {

  name?: string

  value?: number

  notes?: string | null

  category?: string

  payment_method?: string | null

}

export async function updateExpense(id: string, patch: ExpensePatch): Promise<Expense | null> {

  const update: Record<string, unknown> = {}

  if (typeof patch.name === 'string') {

    if (!patch.name.trim()) {

      throw new Error('Nome não pode ficar vazio.')

    }

    update.name = patch.name.trim()

  }

  if (typeof patch.value === 'number') {

    if (!(patch.value >= 0)) {

      throw new Error('Valor inválido.')

    }

    update.value = patch.value

  }

  if (typeof patch.category === 'string' && patch.category.trim()) {

    update.category = patch.category

  }

  if (patch.notes !== undefined) {

    update.notes = patch.notes?.trim() || null

  }

  if (patch.payment_method !== undefined) {

    update.payment_method = patch.payment_method || null

  }

  if (Object.keys(update).length === 0) {

    return null

  }

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('expenses')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

  return data as Expense

}

export async function deleteExpense(id: string) {

  const supabase = await getSupabase()

  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

// Cria recorrente + despesa do mes atual ligada a ele (atomico do ponto
// de vista do usuario: ao adicionar uma despesa marcando "e recorrente",
// nasce na lista do mes ja com o vinculo para o autofill dos proximos.)

export type AddExpenseAndRecurringInput = {

  budget_id: string

  category: string

  name: string

  value: number

  notes?: string | null

  payment_method?: string | null

  duration_months: number | null

  start_month: number

  start_year: number

}

export async function addExpenseAndRecurring(input: AddExpenseAndRecurringInput): Promise<Expense> {

  if (!input.name.trim()) {

    throw new Error('Informe um nome.')

  }

  if (!(input.value >= 0)) {

    throw new Error('Valor inválido.')

  }

  if (input.duration_months !== null && input.duration_months <= 0) {

    throw new Error('Duração precisa ser maior que zero.')

  }

  const supabase = await getSupabase()

  const inserted_recurring = await supabase
    .from('recurring_expenses')
    .insert({
      category: input.category,
      name: input.name.trim(),
      value: input.value,
      active: true,
      duration_months: input.duration_months,
      start_month: input.start_month,
      start_year: input.start_year,
      payment_method: input.payment_method || null

    })
    .select('id')
    .single()

  if (inserted_recurring.error) {

    throw new Error(inserted_recurring.error.message)

  }

  const inserted_expense = await supabase
    .from('expenses')
    .insert({
      budget_id: input.budget_id,
      category: input.category,
      name: input.name.trim(),
      value: input.value,
      notes: input.notes?.trim() || null,
      payment_method: input.payment_method || null,
      recurring_id: inserted_recurring.data.id

    })
    .select('*')
    .single()

  if (inserted_expense.error) {

    throw new Error(inserted_expense.error.message)

  }

  revalidatePath('/', 'layout')

  return inserted_expense.data as Expense

}

// =========================================================================
// RECURRING
// =========================================================================

export async function listRecurring(): Promise<RecurringExpense[]> {

  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {

    throw new Error(error.message)

  }

  return (data ?? []) as RecurringExpense[]

}

type AddRecurringInput = {

  category: string

  name: string

  value: number

  duration_months: number | null

  start_month: number | null

  start_year: number | null

  payment_method?: string | null

}

export async function addRecurring(input: AddRecurringInput) {

  if (!input.name.trim()) {

    throw new Error('Informe um nome.')

  }

  if (!(input.value >= 0)) {

    throw new Error('Valor invalido.')

  }

  if (input.duration_months !== null && input.duration_months <= 0) {

    throw new Error('Duracao precisa ser maior que zero.')

  }

  const supabase = await getSupabase()

  const { error } = await supabase.from('recurring_expenses').insert({
    category: input.category,
    name: input.name.trim(),
    value: input.value,
    active: true,
    duration_months: input.duration_months,
    start_month: input.start_month,
    start_year: input.start_year,
    payment_method: input.payment_method || null

  })

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

export async function toggleRecurring(id: string, active: boolean) {

  const supabase = await getSupabase()

  const { error } = await supabase
    .from('recurring_expenses')
    .update({ active })
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

export async function deleteRecurring(id: string) {

  const supabase = await getSupabase()

  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

function monthsBetween(
  from_month: number,
  from_year: number,
  to_month: number,
  to_year: number
) {

  return (to_year - from_year) * 12 + (to_month - from_month)

}

function isRecurringActiveFor(
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

// Logica de autofill sem revalidatePath — pode ser chamada por outras actions
// internamente (como getOrCreateBudget) sem causar revalidacao duplicada.

async function autofillForBudget(budget_id: string) {

  const supabase = await getSupabase()

  const budget = await supabase
    .from('monthly_budgets')
    .select('month,year')
    .eq('id', budget_id)
    .single()

  if (budget.error) {

    throw new Error(budget.error.message)

  }

  const current_month = budget.data.month

  const current_year = budget.data.year

  // Procura o orçamento anterior mais recente (qualquer mês antes do atual)
  const all_budgets = await supabase
    .from('monthly_budgets')
    .select('id,month,year')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  const previous = (all_budgets.data ?? []).find((b: any) =>
    b.year < current_year ||
    (b.year === current_year && b.month < current_month)

  )

  // IDs de recorrentes que ja existem como despesa no mes atual (evita duplicar)
  const existing = await supabase
    .from('expenses')
    .select('recurring_id')
    .eq('budget_id', budget_id)
    .not('recurring_id', 'is', null)

  const existing_ids = new Set(
    (existing.data ?? []).map((e: any) => e.recurring_id)

  )

  const recurring = await supabase.from('recurring_expenses').select('*')

  if (recurring.error) {

    throw new Error(recurring.error.message)

  }

  const items = (recurring.data ?? []) as RecurringExpense[]

  const applicable = items.filter(
    (r) =>
      !existing_ids.has(r.id) &&
      isRecurringActiveFor(r, current_month, current_year)

  )

  if (applicable.length === 0) {

    return { inserted: 0 }

  }

  // Para cada recorrente, busca o valor da despesa do mês anterior (se houver)
  const rows: Array<{
    budget_id: string
    category: string
    name: string
    value: number
    recurring_id: string
    payment_method: string | null
  }> = []

  for (const r of applicable) {

    let value = Number(r.value)

    if (previous) {

      const prev = await supabase
        .from('expenses')
        .select('value')
        .eq('budget_id', previous.id)
        .eq('recurring_id', r.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (prev.data) {

        value = Number(prev.data.value)

      }

    }

    rows.push({
      budget_id,
      category: r.category,
      name: r.name,
      value,
      recurring_id: r.id,
      payment_method: r.payment_method ?? null

    })

  }

  const { error } = await supabase.from('expenses').insert(rows)

  if (error) {

    throw new Error(error.message)

  }

  return { inserted: rows.length }

}

// Versao publica do autofill (chamada caso queira disparar manual no futuro)
// Mantida como server action para nao quebrar imports antigos.

export async function autofillFromRecurring(budget_id: string) {

  const result = await autofillForBudget(budget_id)

  revalidatePath('/', 'layout')

  return result

}

// =========================================================================
// HISTORY
// =========================================================================

export async function listBudgetHistory(): Promise<
  Array<MonthlyBudget & { total_spent: number }>
> {

  const supabase = await getSupabase()

  const budgets = await supabase
    .from('monthly_budgets')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (budgets.error) {

    throw new Error(budgets.error.message)

  }

  const rows = (budgets.data ?? []).map(hydrateBudget) as MonthlyBudget[]

  if (rows.length === 0) {

    return []

  }

  const ids = rows.map((r) => r.id)

  const expenses = await supabase
    .from('expenses')
    .select('budget_id,value')
    .in('budget_id', ids)

  if (expenses.error) {

    throw new Error(expenses.error.message)

  }

  const totals = new Map<string, number>()

  for (const e of expenses.data ?? []) {

    totals.set(e.budget_id, (totals.get(e.budget_id) ?? 0) + Number(e.value || 0))

  }

  return rows.map((r) => ({ ...r, total_spent: totals.get(r.id) ?? 0 }))

}

export async function deleteBudget(id: string) {

  const supabase = await getSupabase()

  const { error } = await supabase.from('monthly_budgets').delete().eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}
