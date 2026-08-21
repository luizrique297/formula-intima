create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.favorites enable row level security;

create policy "favorites_owner_all" on public.favorites
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_favorites_user on public.favorites (user_id);
