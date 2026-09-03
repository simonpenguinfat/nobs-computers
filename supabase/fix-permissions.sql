-- ============================================================
-- FIX: "permission denied for table build_requests"
-- Run this ONCE in Supabase → SQL Editor → New query → Run
-- ============================================================

-- Allow the app (logged-in users) to access tables
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.build_requests to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.build_quotes to authenticated;

-- Service role (Supabase internal) — usually already set, but safe to include
grant all on public.profiles to service_role;
grant all on public.build_requests to service_role;
grant all on public.messages to service_role;
grant all on public.build_quotes to service_role;
