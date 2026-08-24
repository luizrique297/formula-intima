-- CORREÇÃO CRÍTICA DE SEGURANÇA
--
-- As policies "orders_owner_insert" e "order_items_owner_insert" (migration
-- 0001) permitiam que qualquer cliente autenticado inserisse pedidos e itens
-- de pedido DIRETAMENTE via API, com qualquer status (inclusive "pago") e
-- qualquer valor — sem nunca ter pago nada de verdade. O site nunca usou
-- esse caminho (pedidos sempre são criados pela Edge Function create-payment,
-- que roda com privilégio de servidor e recalcula tudo), então essas
-- policies nunca foram necessárias — só uma porta aberta sem uso legítimo.
--
drop policy if exists "orders_owner_insert" on public.orders;
drop policy if exists "order_items_owner_insert" on public.order_items;
