-- Active Supabase Realtime sur les approbations et les agents
-- (le dashboard reçoit les actions en attente et les changements de statut sans rechargement).
alter publication supabase_realtime add table approvals;
alter publication supabase_realtime add table agents;
