-- Rode no SQL Editor depois do seed_maio_2026.sql para verificar.
-- Cole tudo de uma vez e olhe os 4 resultados.

-- 1) Confirma o orçamento de Maio/2026 ---------------------------------------
select id, month, year, income
from monthly_budgets
where month = 5 and year = 2026;

-- 2) Total esperado: 20 despesas em Maio/2026 (5 recorrentes + 15 avulsas) ---
select count(*) as total_despesas_maio
from expenses
where budget_id = (select id from monthly_budgets where month = 5 and year = 2026);

-- 3) Breakdown por categoria (esperado: 4 linhas) ----------------------------
--    custos_fixos    R$ 779,47   (6 itens)
--    lazer           R$ 557,57   (16 itens)
--    imprevistos     R$  64,20   (4 itens)
--    pessoal_saude   R$  27,90   (1 item)
select
  c.slug,
  c.label,
  count(e.id) as qtd,
  sum(e.value) as total
from expenses e
join categories c on c.slug = e.category
where e.budget_id = (select id from monthly_budgets where month = 5 and year = 2026)
group by c.slug, c.label
order by total desc;

-- 4) Lista os 5 recorrentes ativos --------------------------------------------
select name, value, duration_months, start_month, start_year, payment_method
from recurring_expenses
where active = true
order by name;
