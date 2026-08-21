-- Marca automaticamente quando um pedido entra em status "entregue", para
-- calcular o prazo de 7 dias de arrependimento (CDC) a partir da entrega.
alter table public.orders add column delivered_at timestamptz;

create function public.set_delivered_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'entregue' and old.status is distinct from 'entregue' then
    new.delivered_at = now();
  end if;
  return new;
end;
$$;

create trigger on_order_delivered
  before update on public.orders
  for each row execute procedure public.set_delivered_at();

-- ============================================================
-- SOLICITAÇÕES DE DEVOLUÇÃO / ARREPENDIMENTO
-- ============================================================
create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  comment text,
  status text not null default 'solicitado' check (status in ('solicitado', 'aprovado', 'rejeitado', 'concluido')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.return_requests enable row level security;

create policy "return_requests_owner_read" on public.return_requests
  for select using (auth.uid() = user_id or public.is_admin());

-- Só permite solicitar devolução de pedido próprio, já entregue, e dentro
-- dos 7 dias corridos de direito de arrependimento (Código de Defesa do
-- Consumidor) contados a partir da data de entrega.
create policy "return_requests_owner_insert" on public.return_requests
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status = 'entregue'
        and o.delivered_at >= now() - interval '7 days'
    )
  );

create policy "return_requests_admin_update" on public.return_requests
  for update using (public.is_admin()) with check (public.is_admin());

create index idx_return_requests_order on public.return_requests (order_id);
create index idx_return_requests_user on public.return_requests (user_id);
