-- Required grants for NetChill backend Supabase access
-- Run this in Supabase SQL editor after creating tables.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.analytics to service_role;

grant select on table public.users to authenticated;
grant select on table public.analytics to authenticated;

-- If you use serial/bigserial in future tables, keep sequence grants.
grant usage, select on all sequences in schema public to service_role;
