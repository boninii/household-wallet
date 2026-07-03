'use server'

import { revalidatePath } from 'next/cache'

import { getSupabase } from '@/lib/supabase'

import type { Category } from '@/lib/types'

function isMissingTable(err: { message: string } | null): boolean {

  if (!err) {

    return false

  }

  return /categories|category_allocations/.test(err.message)

}

export async function listCategories(options?: {
  include_archived?: boolean
}): Promise<{ items: Category[]; ready: boolean }> {

  const supabase = getSupabase()

  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (!options?.include_archived) {

    query = query.is('archived_at', null)

  }

  const { data, error } = await query

  if (error) {

    if (isMissingTable(error)) {

      return { items: [], ready: false }

    }

    throw new Error(error.message)

  }

  return { items: (data ?? []) as Category[], ready: true }

}

function slugify(label: string): string {

  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `cat_${Date.now()}`

}

export async function createCategory(input: {
  label: string

  color: string
}) {

  if (!input.label.trim()) {

    throw new Error('Nome da categoria nao pode ficar vazio.')

  }

  const supabase = getSupabase()

  let base_slug = slugify(input.label)

  let slug = base_slug

  let n = 1

  while (true) {

    const existing = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (!existing.data) {

      break

    }

    n += 1

    slug = `${base_slug}_${n}`

    if (n > 50) {

      throw new Error('Nao foi possivel gerar slug unico.')

    }

  }

  const max_order = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const next_order = (max_order.data?.sort_order ?? 0) + 10

  const { error } = await supabase.from('categories').insert({
    slug,
    label: input.label.trim(),
    color: input.color,
    sort_order: next_order,
    is_default: false

  })

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

export async function updateCategory(
  id: string,
  input: { label?: string; color?: string; is_saving?: boolean }
) {

  const patch: Record<string, unknown> = {}

  if (typeof input.label === 'string') {

    if (!input.label.trim()) {

      throw new Error('Nome nao pode ficar vazio.')

    }

    patch.label = input.label.trim()

  }

  if (typeof input.color === 'string') {

    patch.color = input.color

  }

  if (typeof input.is_saving === 'boolean') {

    patch.is_saving = input.is_saving

  }

  if (Object.keys(patch).length === 0) {

    return

  }

  const supabase = getSupabase()

  const { error } = await supabase.from('categories').update(patch).eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}

export async function archiveCategory(id: string) {

  const supabase = getSupabase()

  const { error } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  // Zera as alocacoes da categoria arquivada (para nao contar no total)
  await supabase
    .from('category_allocations')
    .update({ pct: 0 })
    .eq('category_id', id)

  revalidatePath('/', 'layout')

}

export async function restoreCategory(id: string) {

  const supabase = getSupabase()

  const { error } = await supabase
    .from('categories')
    .update({ archived_at: null })
    .eq('id', id)

  if (error) {

    throw new Error(error.message)

  }

  revalidatePath('/', 'layout')

}
