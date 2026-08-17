-- household-wallet :: migration v12
-- Rode APOS a migration_v11. Idempotente.
--
-- Ajusta o nome da categoria padrao para o plural: "Investimentos".
-- O slug continua 'liberdade', por compatibilidade com o que ja foi lancado.

update public.categories
  set label = 'Investimentos'
  where slug = 'liberdade'
  and label in ('Investir', 'Investimento');

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
      (new.id, 'liberdade',     'Investimentos',    '#6366F1', 50, true, true)
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
