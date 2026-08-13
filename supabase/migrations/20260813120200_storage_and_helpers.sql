-- Order numbering + storage buckets.

-- ----------------------------------------------------------- order numbers

create sequence if not exists public.order_number_seq start 1001;

create or replace function public.next_order_number()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'CK' || to_char(now(), 'YYMM') || lpad(nextval('public.order_number_seq')::text, 5, '0');
$$;

alter table public.orders
  alter column order_number set default public.next_order_number();

-- --------------------------------------------------------------- buckets

-- product-images: world-readable catalog photos, admin-managed.
-- cake-photos:    customer uploads for photo cakes, owner-scoped.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true,  5242880,  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('cake-photos',    'cake-photos',    false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy product_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy product_images_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));

-- Customer photo-cake uploads live under <user-id>/<file>, so the first path
-- segment is the owner check.
create policy cake_photos_own on storage.objects
  for all to authenticated
  using (
    bucket_id = 'cake-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'cake-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy cake_photos_admin_read on storage.objects
  for select to authenticated
  using (bucket_id = 'cake-photos' and (select private.is_admin()));
