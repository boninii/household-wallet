import { clsx, type ClassValue } from 'clsx'

import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {

  return twMerge(clsx(inputs))

}

const brl_formatter = new Intl.NumberFormat('pt-BR', {

  style: 'currency',

  currency: 'BRL'

})

export function formatBRL(value: number) {

  return brl_formatter.format(value || 0)

}

const brl_plain_formatter = new Intl.NumberFormat('pt-BR', {

  minimumFractionDigits: 2,

  maximumFractionDigits: 2

})

// Igual ao formatBRL mas sem o "R$ " — pra usar em inputs com prefixo fixo.
export function formatBRLPlain(value: number) {

  return brl_plain_formatter.format(value || 0)

}

export function parseBRL(input: string) {

  if (!input) {

    return 0

  }

  const cleaned = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const parsed = Number(cleaned)

  return Number.isFinite(parsed) ? parsed : 0

}

const MONTHS_PT = [

  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',

  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'

]

export function monthLabel(month: number, year: number) {

  const name = MONTHS_PT[month - 1] ?? ''

  return `${name}/${year}`

}

export function shiftMonth(month: number, year: number, delta: number) {

  const total = (year * 12 + (month - 1)) + delta

  const next_year = Math.floor(total / 12)

  const next_month = (total % 12) + 1

  return { month: next_month, year: next_year }

}
