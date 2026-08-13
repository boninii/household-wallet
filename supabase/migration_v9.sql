-- household-wallet :: migration v9 — corrige 500 no cadastro (signup)
-- Rode APOS a migration_v8. Idempotente.
--
-- CAUSA RAIZ: a coluna categories.is_saving nunca foi criada neste projeto
-- (a migration_v6 foi pulada). O trigger handle_new_user (criado na v8) insere
-- em is_saving ao semear as categorias padrao do novo usuario -> o insert falha
-- -> o Supabase aborta a criacao do usuario -> o signup retorna HTTP 500.
--
-- FIX: (1) cria a coluna is_saving que faltava; (2) blinda o trigger para que,
-- se a semeadura falhar por qualquer motivo, o cadastro AINDA aconteca e o
-- motivo real fique logado como WARNING nos Postgres Logs (sem derrubar tudo).

-- 1. Coluna que faltava (conteudo da migration_v6)
alter table public.categories
  add column if not exists is_saving boolean not null default false;

update public.categories
  set is_saving = true
  where slug = 'liberdade' and is_saving = false;

-- 2. Trigger de seed a prova de falhas
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  begin

    insert into public.categories (user_id, slug, label, color, sort_order, is_default, is_saving)
    values
      (new.id, 'custos_fixos',  'Custos fixos',     '#3B82F6', 10, true, false),
      (new.id, 'pessoal_saude', 'Pessoal & Saúde',  '#22D3EE', 20, true, false),
      (new.id, 'lazer',         'Lazer & Prazeres', '#EC4899', 30, true, false),
      (new.id, 'imprevistos',   'Imprevistos',      '#F97316', 40, true, false),
      (new.id, 'liberdade',     'Investir',         '#6366F1', 50, true, true)
    on conflict (user_id, slug) do nothing;

  exception when others then

    raise warning 'handle_new_user: seed de categorias falhou para % -> %', new.id, sqlerrm;

  end;

  return new;

end $$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

notify pgrst, 'reload schema';
