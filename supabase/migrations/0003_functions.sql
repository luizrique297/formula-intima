-- Baixa de estoque atômica, evita overselling em concorrência.
-- Chamada apenas pelas Edge Functions (service role), nunca pelo cliente.
create function public.decrement_inventory(p_variant_id uuid, p_quantity integer)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  updated_rows integer;
begin
  update public.inventory
  set quantity = quantity - p_quantity, updated_at = now()
  where variant_id = p_variant_id and quantity >= p_quantity;

  get diagnostics updated_rows = row_count;
  return updated_rows > 0;
end;
$$;

revoke all on function public.decrement_inventory(uuid, integer) from public, anon, authenticated;
