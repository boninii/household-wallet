import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Config de teste/coverage. O relatorio inclui TODOS os arquivos do escopo —
// inclusive os sem nenhum teste — para a cobertura refletir o projeto real,
// nao so o que foi executado.

export default defineConfig({

  resolve: {

    // espelha o alias "@/" do tsconfig
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) }

  },

  test: {

    environment: 'node',

    include: ['tests/**/*.test.ts'],

    coverage: {

      provider: 'v8',

      // Todos os arquivos do `include` entram no relatorio, mesmo sem teste
      // (comportamento padrao do provider v8 no vitest 4).
      // Apenas .ts: o provider v8 nao parseia .tsx sem transform de componente
      // (JSX). Os componentes .tsx ficam FORA da instrumentacao — cobertura
      // deles e 0% e isso esta declarado na auditoria; medi-los exigiria
      // jsdom + testing-library.
      include: [
        'lib/**/*.ts',
        'app/actions/**/*.ts',
        'middleware.ts'
      ],

      exclude: ['**/*.d.ts'],

      reporter: ['text-summary', 'json-summary']

    }

  }

})
