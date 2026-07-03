-- household-wallet :: migration v6
-- Rode APÓS as migrations v2..v5. Idempotente.

-- =========================================================================
-- 1. is_saving em categories — categorias de investimento/poupança
--    invertem o significado de "Utilizado": passar bater a meta é BOM.
-- =========================================================================

alter table categories add column if not exists is_saving boolean not null default false;

-- Marca Liberdade financeira (slug 'liberdade') como saving por default.
-- Idempotente — se você já mudou via UI, não sobrescreve.

update categories
  set is_saving = true
  where slug = 'liberdade'
  and is_saving = false;

-- Recarrega o cache de schema do PostgREST (evita "could not find column")
notify pgrst, 'reload schema';
