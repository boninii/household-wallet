-- household-wallet :: migration v8 — MULTI-USUARIO (isolamento por usuario)
-- Rode APOS as migrations v2..v7.
--
-- O QUE ELE FAZ:
--   1. ZERA os dados existentes (orcamentos, despesas, categorias, etc.) —
--      transicao para multi-usuario, sem backfill. fx_rates (cache de cotacao)
--      e preservado por ser global.
--   2. Adiciona user_id em todas as tabelas de dados, com default auth.uid()
--      e FK para auth.users (on delete cascade).
--   3. Torna as constraints unicas POR usuario.
--   4. Liga RLS + policies escopadas por auth.uid() em todas as tabelas.
--   5. Cria trigger que, ao cadastrar um usuario, semeia as categorias padrao.
--
-- E seguro re-rodar: o truncate so acontece na PRIMEIRA vez (antes da coluna
-- user_id existir). Depois disso ele nao apaga mais nada.

create extension if not exists "pgcrypto";

-- =========================================================================
-- 0. ZERA OS DADOS (apenas na primeira execucao)
-- =========================================================================

do $$
begin

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'monthly_budgets'
      and column_name = 'user_id'
  ) then

    truncate table
      category_allocations,
      financing_payments,
      expenses,
      financings,
      recurring_expenses,
      investments,
      monthly_budgets,
      categories
    cascade;

  end if;

end $$;

-- =========================================================================
-- 1. COLUNA user_id EM TODAS AS TABELAS DE DADOS
--    default auth.uid() => inserts via PostgREST ja recebem o dono automatico.
-- =========================================================================

alter table categories          add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table monthly_budgets     add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table category_allocations add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table expenses            add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table recurring_expenses  add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table financings          add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table financing_payments  add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

alter table investments         add column if not exists user_id uuid not null default auth.uid() references auth.users(id) on delete cascade;

-- Indices para os filtros por dono
create index if not exists categories_user_idx          on categories (user_id);
create index if not exists monthly_budgets_user_idx     on monthly_budgets (user_id);
create index if not exists category_allocations_user_idx on category_allocations (user_id);
create index if not exists expenses_user_idx            on expenses (user_id);
create index if not exists recurring_expenses_user_idx  on recurring_expenses (user_id);
create index if not exists financings_user_idx          on financings (user_id);
create index if not exists financing_payments_user_idx  on financing_payments (user_id);
create index if not exists investments_user_idx         on investments (user_id);

-- =========================================================================
-- 2. CONSTRAINTS UNICAS POR USUARIO
-- =========================================================================

-- monthly_budgets: era unique(year, month) -> unique(user_id, year, month)
alter table monthly_budgets drop constraint if exists monthly_budgets_year_month_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'monthly_budgets_user_year_month_key'
  ) then
    alter table monthly_budgets
      add constraint monthly_budgets_user_year_month_key unique (user_id, year, month);
  end if;
end $$;

-- categories: era unique(slug) -> unique(user_id, slug)
alter table categories drop constraint if exists categories_slug_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_user_slug_key'
  ) then
    alter table categories
      add constraint categories_user_slug_key unique (user_id, slug);
  end if;
end $$;

-- =========================================================================
-- 3. RLS + POLICIES POR DONO (auth.uid())
-- =========================================================================

do $$
declare
  t text;
  tables text[] := array[
    'categories',
    'monthly_budgets',
    'category_allocations',
    'expenses',
    'recurring_expenses',
    'financings',
    'financing_payments',
    'investments'
  ];
begin

  foreach t in array tables loop

    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists %I on %I', t || '_sel', t);
    execute format('drop policy if exists %I on %I', t || '_ins', t);
    execute format('drop policy if exists %I on %I', t || '_upd', t);
    execute format('drop policy if exists %I on %I', t || '_del', t);

    execute format(
      'create policy %I on %I for select to authenticated using (user_id = auth.uid())',
      t || '_sel', t
    );

    execute format(
      'create policy %I on %I for insert to authenticated with check (user_id = auth.uid())',
      t || '_ins', t
    );

    execute format(
      'create policy %I on %I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_upd', t
    );

    execute format(
      'create policy %I on %I for delete to authenticated using (user_id = auth.uid())',
      t || '_del', t
    );

  end loop;

end $$;

-- fx_rates: cache GLOBAL de cotacao. Leitura/escrita liberada para autenticados.
alter table fx_rates enable row level security;

drop policy if exists fx_rates_sel on fx_rates;

drop policy if exists fx_rates_write on fx_rates;

drop policy if exists fx_rates_update on fx_rates;

create policy fx_rates_sel    on fx_rates for select to authenticated using (true);

create policy fx_rates_write  on fx_rates for insert to authenticated with check (true);

create policy fx_rates_update on fx_rates for update to authenticated using (true) with check (true);

-- =========================================================================
-- 4. SEED AUTOMATICO: categorias padrao ao cadastrar um usuario
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.categories (user_id, slug, label, color, sort_order, is_default, is_saving)
  values
    (new.id, 'custos_fixos',  'Custos fixos',     '#3B82F6', 10, true, false),
    (new.id, 'pessoal_saude', 'Pessoal & Saúde',  '#22D3EE', 20, true, false),
    (new.id, 'lazer',         'Lazer & Prazeres', '#EC4899', 30, true, false),
    (new.id, 'imprevistos',   'Imprevistos',      '#F97316', 40, true, false),
    (new.id, 'liberdade',     'Investir',         '#6366F1', 50, true, true);

  return new;

end $$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recarrega o cache de schema do PostgREST
notify pgrst, 'reload schema';
