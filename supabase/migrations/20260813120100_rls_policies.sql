-- Row Level Security.
-- Shape: catalog is world-readable, customer data is owner-only, writes are admin-only.
-- Every auth.uid() call is wrapped in (select ...) so it is evaluated once per query,
-- not once per row.

-- ------------------------------------------------------------ admin helper

-- security definer: bypasses RLS on profiles so the admin check itself cannot recurse.
-- Lives in `private` and EXECUTE is revoked from client roles.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke execute on function private.is_admin() from public, anon, authenticated;

alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_variants  enable row level security;
alter table public.delivery_areas    enable row level security;
alter table public.delivery_slots    enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.reviews           enable row level security;
alter table public.wishlist_items    enable row level security;

-- ---------------------------------------------------------------- profiles

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Role escalation is blocked: no client policy grants UPDATE on other rows,
-- and promoting an admin must be done with the service_role key.
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ------------------------------------------------- catalog: public read

create policy categories_public_read on public.categories
  for select to anon, authenticated
  using (is_active);

create policy categories_admin_write on public.categories
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy products_public_read on public.products
  for select to anon, authenticated
  using (is_active);

create policy products_admin_write on public.products
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_images_admin_write on public.product_images
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy product_variants_public_read on public.product_variants
  for select to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy product_variants_admin_write on public.product_variants
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy delivery_areas_public_read on public.delivery_areas
  for select to anon, authenticated
  using (true);

create policy delivery_areas_admin_write on public.delivery_areas
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy delivery_slots_public_read on public.delivery_slots
  for select to anon, authenticated
  using (is_active);

create policy delivery_slots_admin_write on public.delivery_slots
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ------------------------------------------------------------------ orders

create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Orders are created server-side (service_role) after payment verification.
-- This policy only covers the signed-in "place order" path.
create policy orders_insert_own on public.orders
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy orders_admin_all on public.orders
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy order_items_select_own on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy order_items_insert_own on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = (select auth.uid())
    )
  );

create policy order_items_admin_all on public.order_items
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ----------------------------------------------------------------- reviews

create policy reviews_public_read on public.reviews
  for select to anon, authenticated
  using (true);

create policy reviews_write_own on public.reviews
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy reviews_admin_all on public.reviews
  for all to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- --------------------------------------------------------------- wishlists

create policy wishlist_own on public.wishlist_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
