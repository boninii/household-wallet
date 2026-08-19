import { describe, expect, it } from 'vitest'

import {
  COLOR_PRESETS,
  DEFAULT_CATEGORIES_FALLBACK,
  findCategoryBySlug,
  mergeWithAllocations
} from '@/lib/categories'

import { assertHexColor } from '@/lib/validate'

import type { Category } from '@/lib/types'

function cat(id: string, slug: string): Category {

  return {
    id,
    slug,
    label: slug,
    color: '#3B82F6',
    sort_order: 10,
    is_default: true,
    is_saving: false,
    archived_at: null,
    created_at: new Date(0).toISOString()

  }

}

describe('mergeWithAllocations', () => {

  it('anexa o pct pelo ID da categoria; ausentes ficam com 0', () => {

    const cats = [cat('a', 'custos'), cat('b', 'lazer')]

    const merged = mergeWithAllocations(cats, { a: 35 })

    expect(merged.find((c) => c.id === 'a')?.pct).toBe(35)

    expect(merged.find((c) => c.id === 'b')?.pct).toBe(0)

  })

  it('alocacao de categoria que nao existe mais e ignorada sem erro', () => {

    const merged = mergeWithAllocations([cat('a', 'custos')], { fantasma: 50 })

    expect(merged).toHaveLength(1)

    expect(merged[0].pct).toBe(0)

  })

})

describe('findCategoryBySlug', () => {

  it('acha pelo slug e devolve undefined quando nao existe', () => {

    const cats = [cat('a', 'custos'), cat('b', 'lazer')]

    expect(findCategoryBySlug(cats, 'lazer')?.id).toBe('b')

    expect(findCategoryBySlug(cats, 'nao-existe')).toBeUndefined()

  })

})

describe('COLOR_PRESETS', () => {

  it('todas as cores passam na validacao de cor do servidor', () => {

    for (const c of COLOR_PRESETS) {

      expect(() => assertHexColor(c)).not.toThrow()

    }

  })

  it('nao ha cores duplicadas', () => {

    expect(new Set(COLOR_PRESETS).size).toBe(COLOR_PRESETS.length)

  })

})

describe('DEFAULT_CATEGORIES_FALLBACK — precisa espelhar o seed do banco', () => {

  it('tem as 5 categorias padrao com slugs unicos', () => {

    expect(DEFAULT_CATEGORIES_FALLBACK).toHaveLength(5)

    const slugs = DEFAULT_CATEGORIES_FALLBACK.map((c) => c.slug)

    expect(new Set(slugs).size).toBe(5)

  })

  it('"liberdade" chama Investimentos e e a unica de poupanca', () => {

    const savers = DEFAULT_CATEGORIES_FALLBACK.filter((c) => c.is_saving)

    expect(savers).toHaveLength(1)

    expect(savers[0].slug).toBe('liberdade')

    expect(savers[0].label).toBe('Investimentos')

  })

})
