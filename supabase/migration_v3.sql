-- household-wallet :: migration v3
-- Rode APÓS já ter rodado schema.sql e migration_v2.sql.
-- Idempotente: pode rodar mais de uma vez.

-- =========================================================================
-- 1. EXPENSES: NOTAS + LINK PARA RECORRENTE
-- =========================================================================

alter table expenses add column if not exists notes text;

alter table expenses
  add column if not exists recurring_id uuid
  references recurring_expenses(id) on delete set null;

create index if not exists expenses_recurring_id_idx on expenses (recurring_id);

-- =========================================================================
-- 2. CATEGORIAS: Set A
--    Mantém: Custos fixos, Liberdade (renomeada para "Investir")
--    Arquiva: Conforto, Metas, Prazeres, Conhecimento
--    Cria:    Pessoal & Saúde, Lazer, Imprevistos
-- =========================================================================

-- Arquiva as antigas que não pertencem ao Set A
update categories
  set archived_at = now()
  where slug in ('conforto', 'metas', 'prazeres', 'conhecimento')
  and archived_at is null;

-- Zera as alocações das arquivadas para não contar no total
update category_allocations
  set pct = 0
  where category_id in (
    select id from categories
    where slug in ('conforto', 'metas', 'prazeres', 'conhecimento')
  );

-- Renomeia liberdade -> "Investir" (mantém slug por compatibilidade)
update categories
  set label = 'Investir'
  where slug = 'liberdade';

-- Renomeia lazer -> "Lazer & Prazeres" (mantém slug)
update categories
  set label = 'Lazer & Prazeres'
  where slug = 'lazer';

-- Cria as novas (idempotente: só insere se o slug não existir)
insert into categories (slug, label, color, sort_order, is_default)
select * from (values
  ('pessoal_saude', 'Pessoal & Saúde',  '#22D3EE', 20, true),
  ('lazer',         'Lazer & Prazeres', '#EC4899', 30, true),
  ('imprevistos',   'Imprevistos',      '#F97316', 40, true)
) as seed(slug, label, color, sort_order, is_default)
where not exists (
  select 1 from categories where categories.slug = seed.slug
);

-- Ajusta a ordem para ficar consistente no Set A
update categories set sort_order = 10 where slug = 'custos_fixos';

update categories set sort_order = 20 where slug = 'pessoal_saude';

update categories set sort_order = 30 where slug = 'lazer';

update categories set sort_order = 40 where slug = 'imprevistos';

update categories set sort_order = 50 where slug = 'liberdade';

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
