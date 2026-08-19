import { describe, expect, it } from 'vitest'

import {
  INVESTMENT_KINDS,
  INVESTMENT_KIND_META,
  SUBTYPE_SUGGESTIONS
} from '@/lib/investment-kinds'

import { assertHexColor } from '@/lib/validate'

// Fonte unica dos tipos: o gerenciador logado e a pagina publica do link
// compartilhado derivam DAQUI — este teste trava a consistencia entre eles.

const DB_KINDS = ['renda_fixa', 'renda_variavel', 'fundos', 'cripto', 'internacional', 'outros']

describe('INVESTMENT_KINDS', () => {

  it('cobre exatamente os tipos aceitos pelo banco, sem sobra nem falta', () => {

    expect(INVESTMENT_KINDS.map((k) => k.key).sort()).toEqual([...DB_KINDS].sort())

  })

  it('cores validas e sem duplicata; rotulos unicos', () => {

    for (const k of INVESTMENT_KINDS) {

      expect(() => assertHexColor(k.color)).not.toThrow()

    }

    expect(new Set(INVESTMENT_KINDS.map((k) => k.color)).size).toBe(INVESTMENT_KINDS.length)

    expect(new Set(INVESTMENT_KINDS.map((k) => k.label)).size).toBe(INVESTMENT_KINDS.length)

  })

  it('o mapa derivado espelha o array (mesma cor e rotulo por tipo)', () => {

    for (const k of INVESTMENT_KINDS) {

      expect(INVESTMENT_KIND_META[k.key]).toEqual({ label: k.label, color: k.color })

    }

  })

  it('toda chave de sugestao de subtipo e um tipo valido', () => {

    expect(Object.keys(SUBTYPE_SUGGESTIONS).sort()).toEqual([...DB_KINDS].sort())

  })

})
