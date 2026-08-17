-- household-wallet :: migration v11 — COMPARTILHAMENTO DE CARTEIRA
-- Rode APOS a migration_v10. Idempotente.
--
-- Dois modos:
--   1. EDITOR — convite vinculado a um email. A pessoa entra com a conta dela
--      e passa a ver/editar a carteira do dono. Revogavel individualmente.
--   2. VISITANTE — link com token aleatorio, sem login, somente leitura dos
--      investimentos, com validade (24h por padrao) e revogavel.
--
-- Modelo: o `user_id` das tabelas de dados continua sendo o DONO da carteira
-- (nenhuma migracao de dados). O acesso deixa de ser "e seu?" e passa a ser
-- "voce e o dono OU membro?" — via a funcao can_access_wallet().

create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. MEMBROS
-- =========================================================================

create table if not exists wallet_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  -- email de quem aceitou, para o dono identificar o membro na lista
  -- (auth.users nao e legivel pelo cliente).
  member_email text,
  created_at timestamptz not null default now(),
  unique (owner_id, member_id),
  check (owner_id <> member_id)
);

alter table wallet_members add column if not exists member_email text;

-- nome do dono, para o membro identificar a carteira no seletor
alter table wallet_members add column if not exists owner_name text;

create index if not exists wallet_members_owner_idx  on wallet_members (owner_id);
create index if not exists wallet_members_member_idx on wallet_members (member_id);

-- =========================================================================
-- 2. CONVITES (vinculados a um email)
-- =========================================================================

create table if not exists wallet_invites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  token text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_invites_owner_idx on wallet_invites (owner_id);
create index if not exists wallet_invites_token_idx on wallet_invites (token);

-- =========================================================================
-- 3. LINK PUBLICO (somente leitura de investimentos)
-- =========================================================================

create table if not exists public_shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists public_shares_owner_idx on public_shares (owner_id);
create index if not exists public_shares_token_idx on public_shares (token);

-- =========================================================================
-- 4. FUNCAO DE ACESSO
-- =========================================================================

-- SECURITY DEFINER para poder ler wallet_members sem cair na RLS da propria
-- tabela (evita recursao infinita nas policies).
create or replace function public.can_access_wallet(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- coalesce para nunca retornar NULL quando nao ha sessao (auth.uid() null).
  -- A RLS trata NULL como falso, mas explicito e mais seguro de manter.
  select coalesce(
    owner = auth.uid()
    or exists (
      select 1
      from wallet_members m
      where m.owner_id = owner
        and m.member_id = auth.uid()
    ),
    false
  );
$$;

grant execute on function public.can_access_wallet(uuid) to authenticated;

-- =========================================================================
-- 5. POLICIES DAS TABELAS DE DADOS — de "e meu" para "posso acessar"
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
      'create policy %I on %I for select to authenticated using (can_access_wallet(user_id))',
      t || '_sel', t
    );

    execute format(
      'create policy %I on %I for insert to authenticated with check (can_access_wallet(user_id))',
      t || '_ins', t
    );

    execute format(
      'create policy %I on %I for update to authenticated using (can_access_wallet(user_id)) with check (can_access_wallet(user_id))',
      t || '_upd', t
    );

    execute format(
      'create policy %I on %I for delete to authenticated using (can_access_wallet(user_id))',
      t || '_del', t
    );

  end loop;

end $$;

-- =========================================================================
-- 6. POLICIES DAS TABELAS DE COMPARTILHAMENTO
-- =========================================================================

alter table wallet_members enable row level security;

drop policy if exists wallet_members_sel on wallet_members;
drop policy if exists wallet_members_ins on wallet_members;
drop policy if exists wallet_members_del on wallet_members;

-- Dono ve os membros da sua carteira; membro ve os vinculos dele (para saber
-- quais carteiras pode abrir).
create policy wallet_members_sel on wallet_members
  for select to authenticated
  using (owner_id = auth.uid() or member_id = auth.uid());

-- Membros entram apenas via accept_wallet_invite() (SECURITY DEFINER).
create policy wallet_members_ins on wallet_members
  for insert to authenticated
  with check (owner_id = auth.uid());

-- Dono remove quem quiser; membro pode sair sozinho.
create policy wallet_members_del on wallet_members
  for delete to authenticated
  using (owner_id = auth.uid() or member_id = auth.uid());

alter table wallet_invites enable row level security;

drop policy if exists wallet_invites_sel on wallet_invites;
drop policy if exists wallet_invites_ins on wallet_invites;
drop policy if exists wallet_invites_del on wallet_invites;

create policy wallet_invites_sel on wallet_invites
  for select to authenticated using (owner_id = auth.uid());

create policy wallet_invites_ins on wallet_invites
  for insert to authenticated with check (owner_id = auth.uid());

create policy wallet_invites_del on wallet_invites
  for delete to authenticated using (owner_id = auth.uid());

alter table public_shares enable row level security;

drop policy if exists public_shares_sel on public_shares;
drop policy if exists public_shares_ins on public_shares;
drop policy if exists public_shares_upd on public_shares;
drop policy if exists public_shares_del on public_shares;

create policy public_shares_sel on public_shares
  for select to authenticated using (owner_id = auth.uid());

create policy public_shares_ins on public_shares
  for insert to authenticated with check (owner_id = auth.uid());

create policy public_shares_upd on public_shares
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy public_shares_del on public_shares
  for delete to authenticated using (owner_id = auth.uid());

-- =========================================================================
-- 7. ACEITAR CONVITE
-- =========================================================================

create or replace function public.accept_wallet_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  me uuid := auth.uid();
  my_email text;
  owner_label text;
begin

  if me is null then

    return jsonb_build_object('ok', false, 'error', 'Entre na sua conta para aceitar o convite.');

  end if;

  select * into inv
    from wallet_invites
   where token = invite_token
     and accepted_at is null
     and expires_at > now();

  if not found then

    return jsonb_build_object('ok', false, 'error', 'Convite inválido, já usado ou expirado.');

  end if;

  select email into my_email from auth.users where id = me;

  if lower(coalesce(my_email, '')) <> lower(inv.email) then

    return jsonb_build_object('ok', false, 'error', 'Este convite foi enviado para outro email.');

  end if;

  if inv.owner_id = me then

    return jsonb_build_object('ok', false, 'error', 'Você não pode aceitar um convite da sua própria carteira.');

  end if;

  select coalesce(raw_user_meta_data->>'full_name', email) into owner_label
    from auth.users where id = inv.owner_id;

  insert into wallet_members (owner_id, member_id, role, member_email, owner_name)
  values (inv.owner_id, me, inv.role, lower(my_email), owner_label)
  on conflict (owner_id, member_id)
  do update set
    role = excluded.role,
    member_email = excluded.member_email,
    owner_name = excluded.owner_name;

  update wallet_invites set accepted_at = now() where id = inv.id;

  return jsonb_build_object('ok', true, 'owner_id', inv.owner_id);

end $$;

grant execute on function public.accept_wallet_invite(text) to authenticated;

-- Dados do convite para a tela de aceite (sem exigir acesso a tabela).
create or replace function public.get_invite_info(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  owner_name text;
begin

  select * into inv
    from wallet_invites
   where token = invite_token;

  if not found then

    return jsonb_build_object('ok', false, 'error', 'Convite não encontrado.');

  end if;

  if inv.accepted_at is not null then

    return jsonb_build_object('ok', false, 'error', 'Este convite já foi utilizado.');

  end if;

  if inv.expires_at <= now() then

    return jsonb_build_object('ok', false, 'error', 'Este convite expirou.');

  end if;

  select coalesce(raw_user_meta_data->>'full_name', email) into owner_name
    from auth.users where id = inv.owner_id;

  return jsonb_build_object(
    'ok', true,
    'email', inv.email,
    'role', inv.role,
    'owner_name', owner_name,
    'expires_at', inv.expires_at

  );

end $$;

grant execute on function public.get_invite_info(text) to authenticated, anon;

-- =========================================================================
-- 8. LEITURA PUBLICA DOS INVESTIMENTOS (visitante, sem login)
-- =========================================================================

-- Unica porta de entrada anonima: valida token, revogacao e expiracao.
-- Nao expõe notas nem ids — so o necessario para exibir a carteira.
create or replace function public.get_shared_investments(share_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  sh record;
  owner_name text;
  items jsonb;
begin

  select * into sh
    from public_shares
   where token = share_token
     and revoked_at is null
     and expires_at > now();

  if not found then

    return jsonb_build_object('ok', false, 'error', 'Link inválido, revogado ou expirado.');

  end if;

  select coalesce(raw_user_meta_data->>'full_name', 'Carteira') into owner_name
    from auth.users where id = sh.owner_id;

  select coalesce(jsonb_agg(x order by x->>'platform'), '[]'::jsonb) into items
    from (
      select jsonb_build_object(
        'platform', i.platform,
        'kind', i.kind,
        'subtype', i.subtype,
        'currency', i.currency,
        'value', i.value,
        'rate', i.rate,
        'rate_type', i.rate_type,
        'purchase_date', i.purchase_date,
        'maturity_date', i.maturity_date
      ) as x
      from investments i
      where i.user_id = sh.owner_id
    ) t;

  return jsonb_build_object(
    'ok', true,
    'owner_name', owner_name,
    'expires_at', sh.expires_at,
    'items', items

  );

end $$;

grant execute on function public.get_shared_investments(text) to anon, authenticated;

notify pgrst, 'reload schema';
