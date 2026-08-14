-- Live admin dashboard.
--
-- Realtime broadcasts still pass through RLS, so only the admin policy on
-- these tables lets the dashboard see them; customers receive nothing.
-- REPLICA IDENTITY FULL is required for UPDATE payloads to carry the old row,
-- which is how the orders board detects a status transition.

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;

alter table public.orders replica identity full;
