-- household-wallet :: migration v4
-- Rode APÓS schema.sql + migration_v2.sql + migration_v3.sql.
-- Idempotente: pode rodar mais de uma vez.

-- =========================================================================
-- 1. FORMA DE PAGAMENTO em despesas e recorrentes
-- =========================================================================

alter table expenses add column if not exists payment_method text;

alter table recurring_expenses add column if not exists payment_method text;

do $$
begin

  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'expenses' and constraint_name = 'expenses_payment_method_check'
  ) then
    alter table expenses drop constraint expenses_payment_method_check;
  end if;

  alter table expenses add constraint expenses_payment_method_check check (
    payment_method is null or
    payment_method in ('credito','debito','pix','boleto','dinheiro','outro')
  );

  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'recurring_expenses' and constraint_name = 'recurring_expenses_payment_method_check'
  ) then
    alter table recurring_expenses drop constraint recurring_expenses_payment_method_check;
  end if;

  alter table recurring_expenses add constraint recurring_expenses_payment_method_check check (
    payment_method is null or
    payment_method in ('credito','debito','pix','boleto','dinheiro','outro')
  );

end $$;

create index if not exists expenses_payment_method_idx on expenses (payment_method);

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
