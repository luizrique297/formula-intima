-- ENDURECIMENTO: restringe o bucket "product-images" a arquivos de imagem
--
-- A regra de acesso (migration 0002) já garante que só admin pode enviar
-- arquivos, mas não limitava QUAL arquivo. Sem isso, uma sessão de admin
-- comprometida (ex: senha vazada) poderia ser usada para hospedar qualquer
-- tipo de arquivo (script, executável, página HTML maliciosa) servido
-- publicamente a partir do domínio do próprio projeto Supabase. Com este
-- limite, o próprio serviço de Storage recusa o upload antes mesmo de
-- chegar nas regras de acesso, não importa quem esteja enviando.
update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB por imagem
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'product-images';
