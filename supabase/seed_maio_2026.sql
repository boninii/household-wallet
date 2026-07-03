-- household-wallet :: seed Maio/2026 (revisão final)
-- Rode APÓS as 4 migrations.
-- NÃO é idempotente para despesas avulsas: rode UMA vez só.
-- Se rodou a versão anterior, primeiro limpe Maio/2026 com:
--   delete from expenses
--   where budget_id = (select id from monthly_budgets where month=5 and year=2026);
--   delete from recurring_expenses where created_at >= now() - interval '1 day';

-- =========================================================================
-- 1) Garante o orçamento de Maio/2026
-- =========================================================================

insert into monthly_budgets (month, year, income)
values (5, 2026, 2500.00)
on conflict (year, month) do nothing;

-- =========================================================================
-- 2) Cadastra os 5 recorrentes ativos (idempotente por nome)
--    e lança a despesa de Maio com link recurring_id
--    Apenas o ALUGUEL tem valor fixo; os demais variam mês a mês —
--    o autofill puxa o valor do mês anterior automaticamente.
-- =========================================================================

with new_recurring as (

  insert into recurring_expenses (
    category, name, value, active,
    start_month, start_year, duration_months,
    payment_method
  )
  select * from (values
    ('custos_fixos', 'Conta de luz',    105.66, true, 5, 2026, null::int, 'pix'),
    ('custos_fixos', 'Internet',         89.99, true, 5, 2026, null::int, 'pix'),
    ('custos_fixos', 'Conta de água',    44.82, true, 5, 2026, null::int, 'boleto'),
    ('custos_fixos', 'Aluguel',         423.00, true, 5, 2026, 9,         'boleto'),
    ('custos_fixos', 'Corte de cabelo',  90.00, true, 5, 2026, null::int, 'pix')
  ) as r(category, name, value, active, start_month, start_year, duration_months, payment_method)
  where not exists (
    select 1 from recurring_expenses where recurring_expenses.name = r.name
  )
  returning id, category, name, value, payment_method
)

insert into expenses (budget_id, category, name, value, recurring_id, payment_method, notes)
select
  (select id from monthly_budgets where month = 5 and year = 2026),
  category, name, value, id, payment_method,
  case name
    when 'Aluguel'         then 'valor fixo até 01/2027 (9 parcelas)'
    when 'Conta de luz'    then 'valor varia mês a mês'
    when 'Internet'        then 'valor varia mês a mês'
    when 'Conta de água'   then 'valor varia mês a mês'
    when 'Corte de cabelo' then 'valor varia (eu sozinho ou + irmão)'
    else null
  end
from new_recurring;

-- =========================================================================
-- 3) Despesas avulsas em Maio/2026
-- =========================================================================

insert into expenses (budget_id, category, name, value, notes, payment_method) values

  -- Custos fixos avulsas (só água casa)
  ((select id from monthly_budgets where month=5 and year=2026), 'custos_fixos', 'Água casa (2 galões)', 26.00, null, 'pix'),

  -- Pessoal & Saúde
  ((select id from monthly_budgets where month=5 and year=2026), 'pessoal_saude', 'Farmácia',           27.90, null, 'pix'),

  -- Imprevistos (com justificativa)
  ((select id from monthly_budgets where month=5 and year=2026), 'imprevistos', 'Borrachinha torneira', 1.50, 'manutenção da casa', 'pix'),
  ((select id from monthly_budgets where month=5 and year=2026), 'imprevistos', 'Mototáxi #2',         10.00, 'moto consertando', 'pix'),
  ((select id from monthly_budgets where month=5 and year=2026), 'imprevistos', 'Mototáxi #1',         13.00, 'moto consertando', 'pix'),
  ((select id from monthly_budgets where month=5 and year=2026), 'imprevistos', 'Correios (carta)',    39.70, 'necessidade', 'pix'),

  -- Lazer & Prazeres avulsas (PIX/débito)
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Pão padaria',                8.60, null, 'pix'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Supermercado (rodinho)',    20.15, 'utensílio de limpeza', 'pix');

-- =========================================================================
-- 4) Lazer & Prazeres — cartão de crédito (14 itens, R$ 528,82)
-- =========================================================================

insert into expenses (budget_id, category, name, value, notes, payment_method) values

  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Apple',                       3.50, 'item Canva pra namorada', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Luanzinho Churros',           6.00, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Amigão Penápolis',            6.18, 'fui comprar bobeira', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Pb Administradora',          11.00, 'estacionamento do shopping', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Cervejaria Cardozo',         12.00, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Iron Academia',              12.90, 'barrinha de cereal', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Canela Panificadora',        13.00, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Jim.com',                    16.00, 'sorvete', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Bardabel',                   27.90, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', '40 Graus Vestuário (1/2)',   49.95, 'presente', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Jabuticabeira Tropical',     54.00, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Dom Belloni Pizzaria',       76.45, null, 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Lojas Renner (1/3)',         99.94, 'presente', 'credito'),
  ((select id from monthly_budgets where month=5 and year=2026), 'lazer', 'Jerônimo Araçatuba',        140.00, null, 'credito');

-- =========================================================================
-- Conferência esperada por categoria:
--   custos_fixos:    R$ 779,47  (1 avulsa + 5 recorrentes)
--   pessoal_saude:   R$  27,90
--   lazer:           R$ 557,57  (14 cartão + 2 avulsas)
--   imprevistos:     R$  64,20  (4 itens)
--   TOTAL Maio:      R$ 1.429,14
--   Saldo livre:     R$ 1.070,86 (42,8% da renda)
-- =========================================================================
