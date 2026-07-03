-- household-wallet :: schema single-user (LOCAL)
-- Execute este script no SQL Editor do Supabase do projeto.

create extension if not exists "pgcrypto";

-- Orcamento de um mes especifico ----------------------------------------------

create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  month int not null check (month between 1 and 12),
  year int not null,
  income numeric(14,2) not null default 0,

  custos_fixos_pct numeric(5,2) not null default 30,
  conforto_pct numeric(5,2) not null default 10,
  metas_pct numeric(5,2) not null default 20,
  prazeres_pct numeric(5,2) not null default 10,
  liberdade_pct numeric(5,2) not null default 25,
  conhecimento_pct numeric(5,2) not null default 5,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, month)
);

-- Despesas reais lancadas dentro de um orcamento mensal -----------------------

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references monthly_budgets(id) on delete cascade,
  category text not null check (
    category in (
      'custos_fixos', 'conforto', 'metas',
      'prazeres', 'liberdade', 'conhecimento'
    )
  ),
  name text not null,
  value numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists expenses_budget_id_idx on expenses (budget_id);
create index if not exists expenses_category_idx on expenses (category);

-- Catalogo de despesas recorrentes usado pelo auto-preenchimento --------------

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'custos_fixos', 'conforto', 'metas',
      'prazeres', 'liberdade', 'conhecimento'
    )
  ),
  name text not null,
  value numeric(14,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger para manter updated_at ---------------------------------------------

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists monthly_budgets_touch on monthly_budgets;

create trigger monthly_budgets_touch
  before update on monthly_budgets
  for each row execute function touch_updated_at();

-- RLS off pois trata-se de uso 100% local com a anon key.
-- Se um dia decidir abrir auth, ligue RLS aqui.

alter table monthly_budgets disable row level security;
alter table expenses        disable row level security;
alter table recurring_expenses disable row level security;
