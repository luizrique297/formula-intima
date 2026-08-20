-- Frete por estado (UF). Não é uma cotação real dos Correios — é uma tabela
-- própria que o admin configura; o frontend descobre a UF a partir do CEP
-- digitado (via API pública ViaCEP) e busca o valor aqui.
create table public.shipping_rates (
  uf text primary key check (char_length(uf) = 2),
  price_cents integer not null check (price_cents >= 0),
  updated_at timestamptz not null default now()
);

alter table public.shipping_rates enable row level security;

create policy "shipping_rates_public_read" on public.shipping_rates
  for select using (true);

create policy "shipping_rates_admin_write" on public.shipping_rates
  for all using (public.is_admin()) with check (public.is_admin());

-- Valores de partida (placeholder) — ajustar no painel admin depois de simular
-- o frete real a partir do CEP de onde os pedidos serão despachados.
-- SP grátis, como pedido; demais agrupados por região de forma aproximada.
insert into public.shipping_rates (uf, price_cents) values
  ('SP', 0),
  ('RJ', 1800), ('MG', 1800), ('ES', 1800),
  ('PR', 1800), ('SC', 1800), ('RS', 1800),
  ('DF', 2500), ('GO', 2500), ('MT', 2500), ('MS', 2500),
  ('BA', 2500), ('SE', 2500), ('AL', 2500), ('PE', 2500), ('PB', 2500),
  ('RN', 2500), ('CE', 2500), ('PI', 2500), ('MA', 2500),
  ('AM', 3200), ('PA', 3200), ('AC', 3200), ('RO', 3200),
  ('RR', 3200), ('AP', 3200), ('TO', 3200);

-- Registra o frete cobrado em cada pedido, separado do valor dos produtos.
alter table public.orders add column shipping_cents integer not null default 0 check (shipping_cents >= 0);
