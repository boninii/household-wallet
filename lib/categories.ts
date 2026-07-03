import type { Category, CategoryWithPct } from './types'

export const COLOR_PRESETS = [

  '#3B82F6', '#22D3EE', '#FACC15', '#EC4899',

  '#6366F1', '#F97316', '#A78BFA', '#10B981',

  '#F43F5E', '#84CC16', '#06B6D4', '#D946EF',

  '#FB923C', '#34D399', '#818CF8', '#FB7185',

  '#A3E635', '#67E8F9', '#FCD34D', '#C084FC'

]

export const DEFAULT_CATEGORIES_FALLBACK: Category[] = [

  {
    id: 'default-custos_fixos',
    slug: 'custos_fixos',
    label: 'Custos fixos',
    color: '#3B82F6',
    sort_order: 10,
    is_default: true,
    is_saving: false,
    archived_at: null,
    created_at: new Date(0).toISOString()

  },

  {
    id: 'default-pessoal_saude',
    slug: 'pessoal_saude',
    label: 'Pessoal & Saúde',
    color: '#22D3EE',
    sort_order: 20,
    is_default: true,
    is_saving: false,
    archived_at: null,
    created_at: new Date(0).toISOString()

  },

  {
    id: 'default-lazer',
    slug: 'lazer',
    label: 'Lazer & Prazeres',
    color: '#EC4899',
    sort_order: 30,
    is_default: true,
    is_saving: false,
    archived_at: null,
    created_at: new Date(0).toISOString()

  },

  {
    id: 'default-imprevistos',
    slug: 'imprevistos',
    label: 'Imprevistos',
    color: '#F97316',
    sort_order: 40,
    is_default: true,
    is_saving: false,
    archived_at: null,
    created_at: new Date(0).toISOString()

  },

  {
    id: 'default-liberdade',
    slug: 'liberdade',
    label: 'Investir',
    color: '#6366F1',
    sort_order: 50,
    is_default: true,
    is_saving: true,
    archived_at: null,
    created_at: new Date(0).toISOString()

  }

]

export function mergeWithAllocations(
  categories: Category[],
  allocations: Record<string, number>
): CategoryWithPct[] {

  return categories.map((c) => ({
    ...c,
    pct: allocations[c.id] ?? 0

  }))

}

export function findCategoryBySlug(
  categories: Category[],
  slug: string
): Category | undefined {

  return categories.find((c) => c.slug === slug)

}
