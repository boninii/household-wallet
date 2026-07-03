-- household-wallet :: migration v2 (FINAL)
-- Roda este script INTEIRO no SQL Editor do Supabase.
-- E idempotente: pode rodar mais de uma vez sem quebrar.

create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. RECORRENTES COM DURACAO
-- =========================================================================

alter table recurring_expenses add column if not exists start_month int;

alter table recurring_expenses add column if not exists start_year int;

alter table recurring_expenses add column if not exists duration_months int;

-- =========================================================================
-- 2. CATEGORIAS DINAMICAS + ALOCACOES POR MES
-- =========================================================================

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  color text not null,
  sort_order int not null default 100,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

insert into categories (slug, label, color, sort_order, is_default)
select * from (values
  ('custos_fixos', 'Custos fixos', '#3B82F6', 10, true),
  ('conforto', 'Conforto', '#22D3EE', 20, true),
  ('metas', 'Metas', '#FACC15', 30, true),
  ('prazeres', 'Prazeres', '#EC4899', 40, true),
  ('liberdade', 'Liberdade financeira', '#6366F1', 50, true),
  ('conhecimento', 'Conhecimento', '#F97316', 60, true)
) as seed(slug, label, color, sort_order, is_default)
where not exists (select 1 from categories where categories.slug = seed.slug);

create table if not exists category_allocations (
  budget_id uuid not null references monthly_budgets(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  pct numeric(5,2) not null default 0,
  primary key (budget_id, category_id)
);

alter table categories disable row level security;

alter table category_allocations disable row level security;

-- Backfill: copia os valores das colunas legadas (custos_fixos_pct, etc) para alocacoes
do $$
declare
  b record;
  c record;
  legacy_pct numeric;
begin
  for b in select * from monthly_budgets loop

    for c in select id, slug from categories where is_default loop

      legacy_pct := case c.slug
        when 'custos_fixos' then b.custos_fixos_pct
        when 'conforto' then b.conforto_pct
        when 'metas' then b.metas_pct
        when 'prazeres' then b.prazeres_pct
        when 'liberdade' then b.liberdade_pct
        when 'conhecimento' then b.conhecimento_pct
        else 0
      end;

      insert into category_allocations (budget_id, category_id, pct)
      values (b.id, c.id, coalesce(legacy_pct, 0))
      on conflict (budget_id, category_id) do nothing;

    end loop;

  end loop;
end $$;

-- =========================================================================
-- 3. EXPENSES / RECURRING: REMOVER CHECK PARA ACEITAR QUALQUER SLUG
-- =========================================================================

do $$
begin

  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'expenses' and constraint_name = 'expenses_category_check'
  ) then
    alter table expenses drop constraint expenses_category_check;
  end if;

  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'recurring_expenses' and constraint_name = 'recurring_expenses_category_check'
  ) then
    alter table recurring_expenses drop constraint recurring_expenses_category_check;
  end if;

end $$;

-- =========================================================================
-- 4. FINANCIAMENTOS
-- =========================================================================

create table if not exists financings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'custos_fixos',
  total_parcels int not null check (total_parcels > 0),
  parcel_value numeric(14,2) not null check (parcel_value >= 0),
  paid_parcels int not null default 0 check (paid_parcels >= 0),
  interest_rate numeric(7,4),
  start_month int not null,
  start_year int not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table financings add column if not exists down_payment numeric(14,2) not null default 0;

alter table financings add column if not exists total_value numeric(14,2);

do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'financings' and constraint_name = 'financings_category_check'
  ) then
    alter table financings drop constraint financings_category_check;
  end if;
end $$;

create table if not exists financing_payments (
  id uuid primary key default gen_random_uuid(),
  financing_id uuid not null references financings(id) on delete cascade,
  budget_id uuid not null references monthly_budgets(id) on delete cascade,
  parcel_number int not null,
  value numeric(14,2) not null,
  expense_id uuid references expenses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (financing_id, parcel_number)
);

create index if not exists financing_payments_financing_idx on financing_payments (financing_id);

create index if not exists financing_payments_budget_idx on financing_payments (budget_id);

alter table financings disable row level security;

alter table financing_payments disable row level security;

-- =========================================================================
-- 5. INVESTIMENTOS
-- =========================================================================

create table if not exists investments (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  kind text not null check (
    kind in ('renda_fixa','renda_variavel','fundos','cripto','internacional','outros')
  ),
  subtype text,
  currency text not null default 'BRL' check (currency in ('BRL','USD')),
  value numeric(14,2) not null check (value >= 0),
  rate numeric(8,4),
  maturity_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists investments_touch on investments;

create trigger investments_touch
  before update on investments
  for each row execute function touch_updated_at();

alter table investments disable row level security;

-- =========================================================================
-- 6. FX RATES (cache da cotacao USD/BRL)
-- =========================================================================

create table if not exists fx_rates (
  pair text primary key,
  rate numeric(12,6) not null,
  fetched_at timestamptz not null default now()
);

alter table fx_rates disable row level security;

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
