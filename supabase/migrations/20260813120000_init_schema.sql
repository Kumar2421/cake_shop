-- Cake shop core schema.
-- Money is stored as integer paise (never float) so totals stay exact.
-- All identifiers lowercase; every foreign key gets an index.

create schema if not exists private;

-- ---------------------------------------------------------------- profiles

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile per auth user. role gates admin dashboard access.';

create index profiles_role_idx on public.profiles (role) where role = 'admin';

-- ------------------------------------------------------------- categories

create table public.categories (
  id bigint generated always as identity primary key,
  parent_id bigint references public.categories (id) on delete cascade,
  slug text not null unique,
  name text not null,
  -- URL segment used by /p/[category]/[slug], e.g. 'cake', 'theme-cake'.
  route_segment text,
  image_url text,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint categories_no_self_parent check (parent_id is distinct from id)
);

create index categories_parent_id_idx on public.categories (parent_id);
create index categories_active_position_idx on public.categories (position) where is_active;

-- --------------------------------------------------------------- products

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories (id) on delete set null,
  slug text not null unique,
  sku text not null unique,
  name text not null,
  description text,
  chef_word text,
  -- Lowest variant price, denormalised for listing sort/filter.
  base_price_paise integer not null check (base_price_paise >= 0),
  price_note text default '(Inclusive of GST)',
  rating numeric(2, 1) check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  is_eggless boolean not null default false,
  tag text,
  flavour text,
  is_active boolean not null default true,
  is_bestseller boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_active_price_idx on public.products (base_price_paise) where is_active;
create index products_bestseller_idx on public.products (id) where is_bestseller and is_active;
create index products_flavour_idx on public.products (flavour) where is_active;

-- Trigram-free full-text search over name + description.
alter table public.products
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index products_search_idx on public.products using gin (search_vector);

-- --------------------------------------------------------- product_images

create table public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id, position);

-- ------------------------------------------------------- product_variants

-- One row per purchasable weight, e.g. '0.5 Kg' / '1 Kg'. Price lives here.
create table public.product_variants (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  weight_label text not null,
  serving_label text,
  price_paise integer not null check (price_paise >= 0),
  sku text unique,
  stock integer,
  position integer not null default 0,
  is_active boolean not null default true,
  unique (product_id, weight_label)
);

create index product_variants_product_id_idx on public.product_variants (product_id, position);

-- --------------------------------------------------------- delivery config

create table public.delivery_areas (
  id bigint generated always as identity primary key,
  pincode text not null unique check (pincode ~ '^[1-9][0-9]{5}$'),
  city text not null,
  is_serviceable boolean not null default true,
  supports_same_day boolean not null default true,
  delivery_fee_paise integer not null default 0 check (delivery_fee_paise >= 0)
);

create index delivery_areas_city_idx on public.delivery_areas (city) where is_serviceable;

create table public.delivery_slots (
  id bigint generated always as identity primary key,
  label text not null,
  start_time time not null,
  end_time time not null,
  surcharge_paise integer not null default 0 check (surcharge_paise >= 0),
  position integer not null default 0,
  is_active boolean not null default true,
  constraint delivery_slots_time_order check (end_time > start_time)
);

-- ----------------------------------------------------------------- orders

create table public.orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled')),

  subtotal_paise integer not null check (subtotal_paise >= 0),
  delivery_fee_paise integer not null default 0 check (delivery_fee_paise >= 0),
  discount_paise integer not null default 0 check (discount_paise >= 0),
  total_paise integer not null check (total_paise >= 0),

  recipient_name text not null,
  recipient_phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  pincode text not null,

  delivery_date date not null,
  delivery_slot_id bigint references public.delivery_slots (id) on delete set null,
  delivery_instructions text,

  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'razorpay'
    check (payment_method in ('razorpay', 'cod')),
  razorpay_order_id text,
  razorpay_payment_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id, created_at desc);
create index orders_delivery_slot_id_idx on public.orders (delivery_slot_id);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_delivery_date_idx on public.orders (delivery_date);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  variant_id bigint references public.product_variants (id) on delete set null,

  -- Snapshot: the order must survive the product being renamed or deleted.
  product_name text not null,
  weight_label text,
  image_url text,
  unit_price_paise integer not null check (unit_price_paise >= 0),
  quantity integer not null check (quantity > 0),

  cake_message text,
  photo_url text
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

-- ---------------------------------------------------------------- reviews

create table public.reviews (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_id_idx on public.reviews (product_id, created_at desc);
create index reviews_user_id_idx on public.reviews (user_id);

-- -------------------------------------------------------------- wishlists

create table public.wishlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index wishlist_items_product_id_idx on public.wishlist_items (product_id);

-- ------------------------------------------------------- updated_at trigger

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function private.set_updated_at();

-- ------------------------------------------------ profile on user creation

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
