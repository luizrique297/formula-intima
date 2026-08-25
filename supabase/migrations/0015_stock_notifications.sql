-- "Avise-me quando chegar": cliente pede pra ser avisada por e-mail quando
-- uma variante esgotada voltar ao estoque. A Edge Function notify-restock
-- (disparada por Database Webhook em UPDATE de `inventory`) lê esta tabela
-- quando a quantidade sai de 0, manda o e-mail e apaga os pedidos atendidos.
create table public.stock_notifications (
  user_id uuid not null references public.profiles (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

alter table public.stock_notifications enable row level security;

create policy "stock_notifications_owner_all" on public.stock_notifications
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_stock_notifications_variant on public.stock_notifications (variant_id);
