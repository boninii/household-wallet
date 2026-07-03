-- household-wallet :: migration v7
-- Rode APÓS as migrations v2..v6. Idempotente.

-- =========================================================================
-- 1. investments: data da aplicação (compra)
-- =========================================================================

alter table investments add column if not exists purchase_date date;

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
