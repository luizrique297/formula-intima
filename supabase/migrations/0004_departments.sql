-- Separa o catálogo em duas áreas: lingerie e sex shop. O aviso de 18+ no
-- frontend só é mostrado na área "sex_shop" — esta coluna é o que permite
-- essa separação (cada categoria pertence a uma área, e todo produto herda a
-- área da sua categoria).
alter table public.categories
  add column department text not null default 'lingerie' check (department in ('lingerie', 'sex_shop'));
