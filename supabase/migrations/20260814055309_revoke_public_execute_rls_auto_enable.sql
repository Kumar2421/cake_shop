-- Event-trigger functions never need EXECUTE granted to API roles; the trigger
-- fires as the database owner. Leaving it callable via /rest/v1/rpc is
-- needless attack surface.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
