create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

alter table public.product_reviews enable row level security;

create policy "product_reviews_public_read" on public.product_reviews
  for select using (true);

-- Só permite avaliar um produto de um pedido próprio que já foi entregue e
-- que realmente contém esse produto — evita avaliações falsas.
create policy "product_reviews_owner_insert" on public.product_reviews
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.orders o
      join public.order_items oi on oi.order_id = o.id
      join public.product_variants pv on pv.id = oi.variant_id
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status = 'entregue'
        and pv.product_id = product_reviews.product_id
    )
  );

create index idx_product_reviews_product on public.product_reviews (product_id);
