-- Date de création des abonnements (courbe d'évolution dans l'admin).
alter table subscriptions add column created_at timestamptz not null default now();
