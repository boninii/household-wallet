import type { InvestmentKind } from './types'

// Fonte UNICA dos tipos de investimento (rotulo + cor + sugestoes de subtipo).
// Antes isso existia duplicado em investments-manager (KINDS) e em
// shared-wallet-view (KIND_META) — mudar um e esquecer o outro faria o
// visitante do link publico ver cores/nomes diferentes do dono.

export type InvestmentKindMeta = {

  key: InvestmentKind

  label: string

  color: string

}

export const INVESTMENT_KINDS: InvestmentKindMeta[] = [

  { key: 'renda_fixa', label: 'Renda fixa', color: '#22D3EE' },

  { key: 'renda_variavel', label: 'Renda variável', color: '#EC4899' },

  { key: 'fundos', label: 'Fundos', color: '#FACC15' },

  { key: 'cripto', label: 'Cripto', color: '#F97316' },

  { key: 'internacional', label: 'Internacional', color: '#6366F1' },

  { key: 'outros', label: 'Outros', color: '#A78BFA' }

]

export const INVESTMENT_KIND_META: Record<string, { label: string; color: string }> =
  Object.fromEntries(
    INVESTMENT_KINDS.map((k) => [k.key, { label: k.label, color: k.color }])

  )

export const SUBTYPE_SUGGESTIONS: Record<InvestmentKind, string[]> = {

  renda_fixa: ['CDB', 'LCI', 'LCA', 'Tesouro Selic', 'Tesouro IPCA', 'Tesouro Pré', 'Debênture', 'CRA', 'CRI'],

  renda_variavel: ['Ações', 'BDR', 'ETF', 'FII', 'Opções'],

  fundos: ['Multimercado', 'Ações', 'Imobiliário', 'Cambial'],

  cripto: ['BTC', 'ETH', 'Stablecoin', 'Altcoin'],

  internacional: ['Stocks', 'ETF', 'REIT', 'Bonds'],

  outros: []

}
