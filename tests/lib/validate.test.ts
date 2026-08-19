import { describe, expect, it } from 'vitest'

import {
  MAX_MONEY,
  PASSWORD_MIN,
  PASSWORD_REQUIREMENTS_MESSAGE,
  PASSWORD_RULES,
  assertHexColor,
  assertLabel,
  assertMoney,
  assertMonthYear,
  assertPaymentMethod,
  isStrongPassword
} from '@/lib/validate'

// Estas regras protegem TODAS as server actions — sao a ultima linha antes do
// banco. Os testes cobrem as bordas exatas (limites, zero, negativo, NaN).

describe('assertMoney', () => {

  it('aceita zero e valores positivos comuns', () => {

    expect(() => assertMoney(0, 'Valor')).not.toThrow()

    expect(() => assertMoney(1234.56, 'Valor')).not.toThrow()

  })

  it('aceita exatamente o teto e rejeita 1 centavo acima', () => {

    expect(() => assertMoney(MAX_MONEY, 'Valor')).not.toThrow()

    expect(() => assertMoney(MAX_MONEY + 0.01, 'Valor')).toThrow(/limite/)

  })

  it('rejeita negativo, NaN e Infinity', () => {

    expect(() => assertMoney(-0.01, 'Valor')).toThrow(/inválido/)

    expect(() => assertMoney(Number.NaN, 'Valor')).toThrow(/inválido/)

    expect(() => assertMoney(Number.POSITIVE_INFINITY, 'Valor')).toThrow()

  })

  it('inclui o rotulo do campo na mensagem de erro', () => {

    expect(() => assertMoney(-1, 'Renda')).toThrow(/^Renda/)

  })

})

describe('assertMonthYear', () => {

  it('aceita os limites do calendario e do intervalo de anos', () => {

    expect(() => assertMonthYear(1, 2000)).not.toThrow()

    expect(() => assertMonthYear(12, 2100)).not.toThrow()

  })

  it('null e undefined significam "nao informado" e passam', () => {

    expect(() => assertMonthYear(null, null)).not.toThrow()

    expect(() => assertMonthYear(undefined, 2026)).not.toThrow()

  })

  it('rejeita mes 0, 13 e fracionado (ex: ?month=99 na URL)', () => {

    expect(() => assertMonthYear(0, 2026)).toThrow(/Mês/)

    expect(() => assertMonthYear(13, 2026)).toThrow(/Mês/)

    expect(() => assertMonthYear(1.5, 2026)).toThrow(/Mês/)

    expect(() => assertMonthYear(99, 2026)).toThrow(/Mês/)

  })

  it('rejeita anos fora de 2000-2100', () => {

    expect(() => assertMonthYear(6, 1999)).toThrow(/Ano/)

    expect(() => assertMonthYear(6, 2101)).toThrow(/Ano/)

  })

})

describe('assertPaymentMethod', () => {

  it('aceita todas as formas validas e ausencia de valor', () => {

    for (const pm of ['credito', 'debito', 'pix', 'boleto', 'dinheiro', 'outro']) {

      expect(() => assertPaymentMethod(pm)).not.toThrow()

    }

    expect(() => assertPaymentMethod(null)).not.toThrow()

    expect(() => assertPaymentMethod(undefined)).not.toThrow()

    expect(() => assertPaymentMethod('')).not.toThrow()

  })

  it('rejeita valores fora da lista', () => {

    expect(() => assertPaymentMethod('cartao')).toThrow(/inválida/)

    expect(() => assertPaymentMethod('PIX')).toThrow(/inválida/)

  })

})

describe('assertLabel', () => {

  it('rejeita vazio e so-espacos', () => {

    expect(() => assertLabel('')).toThrow(/vazio/)

    expect(() => assertLabel('   ')).toThrow(/vazio/)

  })

  it('aceita exatamente 40 caracteres e rejeita 41', () => {

    expect(() => assertLabel('a'.repeat(40))).not.toThrow()

    expect(() => assertLabel('a'.repeat(41))).toThrow(/longo/)

  })

  it('conta o tamanho apos trim', () => {

    expect(() => assertLabel('  ' + 'a'.repeat(40) + '  ')).not.toThrow()

  })

})

describe('assertHexColor', () => {

  it('aceita #RRGGBB em qualquer caixa', () => {

    expect(() => assertHexColor('#A1b2C3')).not.toThrow()

    expect(() => assertHexColor('#000000')).not.toThrow()

  })

  it('rejeita formato curto, sem #, com lixo e canal alfa', () => {

    expect(() => assertHexColor('#FFF')).toThrow(/Cor/)

    expect(() => assertHexColor('FFFFFF')).toThrow(/Cor/)

    expect(() => assertHexColor('#GGGGGG')).toThrow(/Cor/)

    expect(() => assertHexColor('#FFFFFF00')).toThrow(/Cor/)

    expect(() => assertHexColor(' #FFFFFF')).toThrow(/Cor/)

  })

})

describe('senha — todos os requisitos obrigatorios', () => {

  it('exige as 4 regras juntas', () => {

    expect(isStrongPassword('Abcdef1!')).toBe(true)

  })

  it('falha faltando qualquer regra individual', () => {

    expect(isStrongPassword('Abcde1!')).toBe(false)          // 7 chars

    expect(isStrongPassword('abcdefg1!')).toBe(false)        // sem maiuscula

    expect(isStrongPassword('ABCDEFG1!')).toBe(false)        // sem minuscula

    expect(isStrongPassword('Abcdefgh!')).toBe(false)        // sem numero

    expect(isStrongPassword('Abcdefg1')).toBe(false)         // sem especial

  })

  it('espaco e acento contam como caractere especial', () => {

    expect(isStrongPassword('Abcdef 1')).toBe(true)

    expect(isStrongPassword('Abcdefç1')).toBe(true)

  })

  it('letras acentuadas NAO satisfazem a regra de maiuscula (classe ASCII)', () => {

    // Comportamento atual documentado: 'Á' nao casa com /[A-Z]/, entao uma
    // senha cuja unica "maiuscula" e acentuada falha a regra de caixa.
    expect(isStrongPassword('Ábcdefg1!')).toBe(false)

    // ...e com uma maiuscula ascii junto, passa.
    expect(isStrongPassword('ÁBcdefg1!')).toBe(true)

  })

  it('a lista de regras tem 4 itens e o minimo bate com a constante', () => {

    expect(PASSWORD_RULES).toHaveLength(4)

    expect(PASSWORD_RULES[0].test('a'.repeat(PASSWORD_MIN))).toBe(true)

    expect(PASSWORD_RULES[0].test('a'.repeat(PASSWORD_MIN - 1))).toBe(false)

    expect(PASSWORD_REQUIREMENTS_MESSAGE).toContain(String(PASSWORD_MIN))

  })

})
