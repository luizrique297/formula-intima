-- Permite associar cada foto a uma cor específica do produto (quando o
-- produto tem variantes de cor diferentes). Fotos sem cor definida (null)
-- são genéricas: aparecem para qualquer cor que não tenha foto própria.
alter table public.product_images add column color text;
