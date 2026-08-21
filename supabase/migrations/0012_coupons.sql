create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentual', 'fixo')),
  discount_value integer not null check (discount_value > 0),
  valid_until timestamptz,
  max_uses integer check (max_uses > 0),
  times_used integer not null default 0,
  min_order_cents integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS fica restrita ao admin (leitura inclusa) — cupons não ficam listáveis
-- publicamente, senão qualquer pessoa consegue ver todos os códigos
-- promocionais só consultando a API. Validação de um código específico
-- passa pela function abaixo, que não expõe a lista inteira.
alter table public.coupons enable row level security;

create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- Valida um código de cupom para um valor de carrinho, sem expor a tabela
-- inteira ao cliente. Não incrementa o uso — isso só acontece quando o
-- pedido é de fato criado (na Edge Function de pagamento).
create function public.validate_coupon(p_code text, p_total_cents integer)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  c record;
  discount integer;
begin
  select * into c from public.coupons where upper(code) = upper(p_code) and active = true;

  if not found then
    return jsonb_build_object('valid', false, 'message', 'Cupom não encontrado ou inativo.');
  end if;

  if c.valid_until is not null and c.valid_until < now() then
    return jsonb_build_object('valid', false, 'message', 'Cupom expirado.');
  end if;

  if c.max_uses is not null and c.times_used >= c.max_uses then
    return jsonb_build_object('valid', false, 'message', 'Cupom esgotado.');
  end if;

  if p_total_cents < c.min_order_cents then
    return jsonb_build_object(
      'valid', false,
      'message', 'Valor mínimo de ' || to_char(c.min_order_cents / 100.0, 'FM999990.00') || ' não atingido.'
    );
  end if;

  if c.discount_type = 'percentual' then
    discount := (p_total_cents * c.discount_value) / 100;
  else
    discount := c.discount_value;
  end if;

  if discount > p_total_cents then
    discount := p_total_cents;
  end if;

  return jsonb_build_object('valid', true, 'discount_cents', discount, 'code', c.code);
end;
$$;

grant execute on function public.validate_coupon(text, integer) to anon, authenticated;

-- Chamada apenas pela Edge Function de pagamento (service role) quando um
-- pedido é de fato criado com o cupom aplicado.
create function public.increment_coupon_usage(p_code text)
returns void
language sql
security definer set search_path = public
as $$
  update public.coupons set times_used = times_used + 1 where upper(code) = upper(p_code);
$$;

revoke all on function public.increment_coupon_usage(text) from public, anon, authenticated;

-- Preparado para quando o pagamento (Mercado Pago) for conectado: registra
-- qual cupom foi usado em cada pedido e quanto de desconto foi aplicado.
alter table public.orders add column coupon_code text;
alter table public.orders add column discount_cents integer not null default 0;
