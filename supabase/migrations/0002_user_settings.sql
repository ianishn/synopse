-- Lien compte Synopse ↔ chat Telegram (notifications d'approbation).
-- Flux : le dashboard génère telegram_link_code → l'user clique t.me/<bot>?start=<code>
-- → le webhook reçoit "/start <code>" et renseigne telegram_chat_id.
create table user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  telegram_chat_id text,
  telegram_link_code text unique
);
alter table user_settings enable row level security;
create policy "own settings" on user_settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
