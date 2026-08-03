-- ============================================================
-- SYNOPSE — Migration initiale (schéma spec §2)
-- Appliquer via : Supabase Dashboard > SQL Editor (coller ce fichier)
-- ou `supabase db push` si la CLI est installée.
-- Principe de sécurité : RLS activée PARTOUT. Un user ne voit que ses données.
-- Les endpoints plugin utilisent la clé service_role côté serveur (bypass RLS)
-- après vérification du token d'agent (SHA-256 comparé à pairing_token_hash).
-- ============================================================

-- ---------- Types énumérés ----------
create type agent_status as enum ('active', 'frozen', 'silent');
create type rule_severity as enum ('block', 'confirm', 'notify');
create type approval_status as enum ('pending', 'approved', 'denied', 'expired');

-- ---------- agents ----------
create table agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- SHA-256 hex du token du plugin. Révoquer = régénérer (l'ancien token meurt).
  pairing_token_hash text not null unique,
  framework text not null default 'openclaw',
  last_heartbeat_at timestamptz,
  status agent_status not null default 'active',
  created_at timestamptz not null default now()
);
create index agents_user_idx on agents (user_id);

-- ---------- rule_templates (catalogue global, seedé depuis rules-catalog.ts) ----------
create table rule_templates (
  id text primary key,               -- slug stable, ex. 'no-unknown-domain'
  label_fr text not null,
  description_fr text not null default '',
  matcher_json jsonb not null,       -- forme : RuleMatcher (packages/shared/src/rules.ts)
  profiles text[] not null default '{}',  -- 'perso' | 'commercant' | 'builder'
  default_severity rule_severity not null default 'confirm'
);

-- ---------- rules (règles activées par user) ----------
create table rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id uuid references agents(id) on delete cascade,  -- null = tous les agents
  template_id text references rule_templates(id),          -- null = règle custom
  params_json jsonb not null default '{}',
  enabled boolean not null default true,
  severity rule_severity not null,
  created_at timestamptz not null default now()
);
create index rules_user_idx on rules (user_id);

-- ---------- approvals (file de validation, timeout = refus) ----------
create table approvals (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  rule_id uuid references rules(id) on delete set null,
  action_summary text not null,
  payload_encrypted text,            -- AES-GCM côté API, clé = env PAYLOAD_ENCRYPTION_KEY
  status approval_status not null default 'pending',
  expires_at timestamptz not null,   -- created_at + 15 min ; cron passe pending→expired
  decided_via text,                  -- 'telegram' | 'web'
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index approvals_pending_idx on approvals (agent_id, status) where status = 'pending';

-- ---------- events (journal 90 jours, summary_fr = templates déterministes) ----------
create table events (
  id bigint generated always as identity primary key,
  agent_id uuid not null references agents(id) on delete cascade,
  type text not null,                -- 'blocked' | 'approved' | 'denied' | 'usage' | 'heartbeat' | 'info'
  summary_fr text not null default '',
  meta_json jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index events_agent_time_idx on events (agent_id, created_at desc);
-- Purge 90 j : job cron quotidien (voir docs/BACKEND.md §Jobs) :
--   delete from events where created_at < now() - interval '90 days';

-- ---------- spend (agrégat quotidien par agent) ----------
create table spend (
  agent_id uuid not null references agents(id) on delete cascade,
  day date not null,
  tokens_in bigint not null default 0,
  tokens_out bigint not null default 0,
  est_cost_eur numeric(10,4) not null default 0,
  primary key (agent_id, day)
);

-- ---------- subscriptions (miroir Stripe via webhooks) ----------
create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  plan text not null default 'free',   -- 'free' | 'protege' | 'studio'
  status text not null default 'active'
);

-- ============================================================
-- RLS — un user ne lit/écrit que SES lignes.
-- Le plugin n'a PAS de session Supabase : ses requêtes passent par l'API
-- Next.js avec service_role (bypass RLS) après vérif du token d'agent.
-- ============================================================
alter table agents enable row level security;
alter table rules enable row level security;
alter table approvals enable row level security;
alter table events enable row level security;
alter table spend enable row level security;
alter table subscriptions enable row level security;
alter table rule_templates enable row level security;

-- Tables à user_id direct
create policy "own agents" on agents for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rules" on rules for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own subscription" on subscriptions for select
  using (user_id = auth.uid());

-- Tables liées via agents (sous-requête sur la propriété de l'agent)
create policy "own approvals" on approvals for all
  using (agent_id in (select id from agents where user_id = auth.uid()))
  with check (agent_id in (select id from agents where user_id = auth.uid()));
create policy "own events" on events for select
  using (agent_id in (select id from agents where user_id = auth.uid()));
create policy "own spend" on spend for select
  using (agent_id in (select id from agents where user_id = auth.uid()));

-- Catalogue : lecture pour tout user connecté, écriture réservée service_role
create policy "read templates" on rule_templates for select
  to authenticated using (true);
