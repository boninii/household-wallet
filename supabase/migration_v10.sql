-- household-wallet :: migration v10
-- Rode APOS a migration_v9. Idempotente.
--
-- 1. Renomeia a categoria padrao "Investir" -> "Investimento" (slug 'liberdade'
--    permanece, por compatibilidade com as despesas ja lancadas).
-- 2. Atualiza o seed do trigger para novos cadastros usarem o nome novo.

update public.categories
  set label = 'Investimento'
  where slug = 'liberdade'
  and label = 'Investir';

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
      (new.id, 'liberdade',     'Investimento',     '#6366F1', 50, true, true)
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
