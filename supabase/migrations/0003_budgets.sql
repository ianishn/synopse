-- Plafonds de dépense par agent (F4). NULL = pas de plafond.
alter table agents
  add column daily_budget_eur numeric(8,2),
  add column monthly_budget_eur numeric(8,2);
