-- Código de rastreio (Correios/transportadora) preenchido pelo admin,
-- normalmente ao marcar o pedido como "enviado".
alter table public.orders add column tracking_code text;
