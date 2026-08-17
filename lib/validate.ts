// Validações de regra de negócio compartilhadas pelas server actions.
// Módulo plano (sem 'use server') para poder exportar helpers síncronos.

// Teto de sanidade — o banco usa numeric(14,2); melhor um erro amigável
// aqui do que o erro críptico do Postgres.
export const MAX_MONEY = 999_999_999.99

export const PAYMENT_METHODS = [
  'credito',
  'debito',
  'pix',
  'boleto',
  'dinheiro',
  'outro'
]

export function assertMoney(value: number, label: string) {

  if (!Number.isFinite(value) || value < 0) {

    throw new Error(`${label} inválido — use um número maior ou igual a zero.`)

  }

  if (value > MAX_MONEY) {

    throw new Error(`${label} acima do limite suportado.`)

  }

}

export function assertMonthYear(
  month: number | null | undefined,
  year: number | null | undefined
) {

  if (month !== null && month !== undefined) {

    if (!Number.isInteger(month) || month < 1 || month > 12) {

      throw new Error('Mês inválido.')

    }

  }

  if (year !== null && year !== undefined) {

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {

      throw new Error('Ano inválido.')

    }

  }

}

export function assertPaymentMethod(pm: string | null | undefined) {

  if (pm && !PAYMENT_METHODS.includes(pm)) {

    throw new Error('Forma de pagamento inválida.')

  }

}

export function assertLabel(label: string, max = 40) {

  if (!label.trim()) {

    throw new Error('Nome não pode ficar vazio.')

  }

  if (label.trim().length > max) {

    throw new Error(`Nome muito longo (máx. ${max} caracteres).`)

  }

}

// =========================================================================
// SENHA — regra unica, usada pelo formulario (cliente) e pelas actions
// (servidor). Todos os requisitos sao obrigatorios.
// =========================================================================

export const PASSWORD_MIN = 8

export type PasswordRule = {

  key: string

  label: string

  test: (value: string) => boolean

}

export const PASSWORD_RULES: PasswordRule[] = [

  {
    key: 'len',
    label: `Ao menos ${PASSWORD_MIN} caracteres`,
    test: (v) => v.length >= PASSWORD_MIN

  },

  {
    key: 'case',
    label: 'Maiúscula e minúscula',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v)

  },

  {
    key: 'num',
    label: 'Um número',
    test: (v) => /\d/.test(v)

  },

  {
    key: 'sym',
    label: 'Um caractere especial',
    test: (v) => /[^A-Za-z0-9]/.test(v)

  }

]

export function isStrongPassword(value: string): boolean {

  return PASSWORD_RULES.every((r) => r.test(value))

}

// Mensagem unica para quando a senha nao cumpre todos os requisitos.
export const PASSWORD_REQUIREMENTS_MESSAGE =
  `A senha precisa ter ao menos ${PASSWORD_MIN} caracteres, com maiúscula, minúscula, número e caractere especial.`

export function assertHexColor(color: string) {

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {

    throw new Error('Cor inválida.')

  }

}
