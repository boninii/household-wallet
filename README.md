# Household Wallet

Aplicacao web para controle financeiro: orcamento mensal, metas, recorrentes,
financiamentos e investimentos (BRL e USD). **Multi-usuario** — cada pessoa tem
sua propria carteira, isolada por Row Level Security (RLS) do Supabase.

## Stack

- **Next.js 14** (App Router) + React 18
- **Tailwind CSS** com tema dark e paleta customizada
- **shadcn/ui**-style primitives (Button, Card, Input, Slider, Tabs, Dialog, Tooltip)
- **Recharts** para o donut de distribuicao
- **Supabase** (PostgreSQL) via `@supabase/supabase-js`
- Fontes: **Instrument Serif** (titulos) + **Albert Sans** (corpo) — Google Fonts
- Cotacao USD/BRL: [awesomeapi](https://docs.awesomeapi.com.br) (sem chave)

## Setup

1. **Dependencias**
   ```bash
   npm install
   ```

2. **Schema no Supabase** — abra o SQL Editor e rode na ordem:
   - [`supabase/schema.sql`](./supabase/schema.sql) (base)
   - [`supabase/migration_v2.sql`](./supabase/migration_v2.sql) → [`v7`](./supabase/migration_v7.sql) (categorias dinâmicas, financiamentos, investimentos, fx_rates, formas de pagamento…)
   - [`supabase/migration_v8.sql`](./supabase/migration_v8.sql) (**multi-usuário**: `user_id` + RLS em todas as tabelas, seed de categorias por usuário. ⚠️ **zera os dados existentes** na primeira execução)

3. **Autenticação (Supabase Auth)** — no painel do projeto:
   - **Authentication → Providers → Email**: habilitado.
   - **Authentication → Email → "Confirm email"**: **desligue** para o cadastro
     entrar direto (sem exigir confirmação por email). Religue quando quiser.

4. **Variaveis** — `.env.local` ja contem URL/anon key (usadas por servidor,
   browser e middleware).

5. **Dev**
   ```bash
   npm run dev
   ```
   http://localhost:3000 — sem sessão você cai em `/login` (cadastro pede nome,
   email e senha).

## Rotas

| Rota | O que faz |
|---|---|
| `/` (Resumo) | Mes/renda, donut real, resumo por categoria, card de metas |
| `/despesas` | Lista e adiciona despesas por categoria + auto preenchimento |
| `/metas` | Sliders por categoria, toggle e label custom da categoria "Outros" |
| `/recorrentes` | CRUD com duracao (indeterminado ou X parcelas + mes inicial) |
| `/financiamentos` | Contratos com parcelas — botao "Pagar proxima" gera despesa no mes |
| `/investimentos` | Cadastro com plataforma, tipo, subtipo, moeda (BRL/USD), taxa e vencimento |
| `/historico` | Lista de meses com renda, gasto, saldo, % e link pro mes |

## Toggle BRL / USD

Canto direito da `MonthBar`. A app armazena tudo em **BRL** no banco. Quando voce
escolhe USD, o valor exibido = `valor_brl / cotacao_atual`. A cotacao e cacheada
por 60 min na tabela `fx_rates`; o botao redondo ao lado do toggle forca um refresh.

Investimentos em USD sao gravados em USD mas convertidos no agregado de
patrimonio total para somar com posicoes em BRL.

## Convencoes de codigo

- Indentacao 2 espacos, aspas simples por padrao, sem `;` quando opcional.
- Variaveis em `snake_case`, funcoes em `camelCase()`.
- 1 linha em branco entre linhas de codigo em arquivos TS/TSX.
- `if (...)` sempre com chaves.

## Estrutura

```
app/
  actions/
    budget.ts       orcamento, despesas, recorrentes, autofill, historico
    financing.ts    CRUD financiamentos + payParcel/undoLastParcel
    investment.ts   CRUD investimentos
    fx.ts           cotacao USD/BRL com cache
  page.tsx              /        Resumo
  despesas/page.tsx     /despesas
  metas/page.tsx        /metas
  recorrentes/page.tsx  /recorrentes
  financiamentos/page.tsx
  investimentos/page.tsx
  historico/page.tsx

components/
  budget/         resumo, despesas, metas, donut, summary, goals-card, month-selector, income-input
  recurring/      manager
  financing/      manager
  investing/      manager
  history/        tabela
  shell/          sidebar, currency-provider, currency-toggle, amount, month-bar
  ui/             primitives

lib/
  categories.ts   BASE_CATEGORIES, OUTROS_META, DEFAULT_GOALS, helpers
  types.ts        tipos compartilhados
  supabase.ts     cliente singleton
  utils.ts        cn, formatBRL/parseBRL, monthLabel, shiftMonth

supabase/
  schema.sql           base
  migration_v2.sql     adicionais (outros, financiamentos, investimentos...)
```
