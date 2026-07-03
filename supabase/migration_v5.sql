-- household-wallet :: migration v5
-- Rode APÓS schema.sql + v2 + v3 + v4. Idempotente.

-- =========================================================================
-- 1. investments: tipo da taxa de rendimento
-- =========================================================================

alter table investments add column if not exists rate_type text;

do $$
begin

  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'investments' and constraint_name = 'investments_rate_type_check'
  ) then
    alter table investments drop constraint investments_rate_type_check;
  end if;

  alter table investments add constraint investments_rate_type_check check (
    rate_type is null or
    rate_type in ('cdi','aa','ipca','selic','outro')
  );

end $$;

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
