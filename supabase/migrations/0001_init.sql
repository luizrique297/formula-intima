-- Fórmula Íntima — schema inicial
-- Convenção: toda tabela de negócio tem RLS habilitada. Escritas sensíveis
-- (baixa de estoque, confirmação de pagamento) só acontecem via Edge Function
-- usando a service role key, nunca diretamente do navegador do cliente.

create extension if not exists "pgcrypto";

-- ============================================================
-- PERFIS (1:1 com auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'cliente' check (role in ('cliente', 'admin')),
  age_confirmed boolean not null default false,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'cliente');

-- cria o profile automaticamente quando um usuário se cadastra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- helper: usuário autenticado é admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- ENDEREÇOS
-- ============================================================
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  recipient_name text not null,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

create policy "addresses_owner_all" on public.addresses
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- CATEGORIAS
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories_public_read" on public.categories
  for select using (true);

create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- PRODUTOS
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  is_active boolean not null default true,
  is_sensitive boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_public_read_active" on public.products
  for select using (is_active or public.is_admin());

create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- IMAGENS DE PRODUTO (metadados; arquivos ficam no Storage)
-- ============================================================
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create policy "product_images_public_read" on public.product_images
  for select using (true);

create policy "product_images_admin_write" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- VARIANTES (tamanho / cor)
-- ============================================================
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size text,
  color text,
  sku text unique,
  price_cents_override integer check (price_cents_override >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size, color)
);

alter table public.product_variants enable row level security;

create policy "product_variants_public_read" on public.product_variants
  for select using (true);

create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- ESTOQUE
-- ============================================================
create table public.inventory (
  variant_id uuid primary key references public.product_variants (id) on delete cascade,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now()
);

alter table public.inventory enable row level security;

create policy "inventory_public_read" on public.inventory
  for select using (true);

create policy "inventory_admin_write" on public.inventory
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- CARRINHO
-- ============================================================
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

alter table public.cart_items enable row level security;

create policy "cart_items_owner_all" on public.cart_items
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- PEDIDOS
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  address_id uuid not null references public.addresses (id) on delete restrict,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado')),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "orders_owner_read" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "orders_owner_insert" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- ITENS DO PEDIDO
-- ============================================================
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  product_name text not null,
  variant_label text,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

alter table public.order_items enable row level security;

create policy "order_items_owner_read" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "order_items_owner_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ============================================================
-- PAGAMENTOS (referência ao Mercado Pago)
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  mp_payment_id text unique,
  mp_preference_id text,
  status text not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_owner_read" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- inserts/updates em payments só via service role (Edge Functions) — sem policy de escrita para authenticated/anon.

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_products_category on public.products (category_id);
create index idx_product_variants_product on public.product_variants (product_id);
create index idx_product_images_product on public.product_images (product_id);
create index idx_orders_user on public.orders (user_id);
create index idx_order_items_order on public.order_items (order_id);
create index idx_cart_items_user on public.cart_items (user_id);
