-- Site d'Adrien Da Silva — stockage des photos envoyées depuis l'admin.
-- Projet Supabase personnel « Aïoli doggy » (wtfutafhjfnkdqignlzk), jamais un projet TRACE.
-- Tout ce qui concerne Adrien est à part : schéma adrien_da_silva, bucket adrien-da-silva,
-- règles préfixées « adrien-da-silva ». Rien ne touche aux tables d'Aïoli doggy.
-- À coller dans le SQL Editor, puis « Run ».
-- Rejouable sans risque.
--
-- Pré-requis (tableau de bord Supabase, pas en SQL) :
--   Authentication → Sign In / Providers → Third-Party Auth → Add provider → Firebase,
--   Project ID : artist-portfolio-28ba9
-- Supabase accepte alors les jetons de connexion Google du site (Firebase Auth).

-- 1. Bucket public : lecture libre par l'adresse publique, 15 Mo par image au plus.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adrien-da-silva', 'adrien-da-silva', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Qui peut écrire : un jeton Firebase de CE projet, e-mail vérifié, dans la liste.
--    Même liste que ADMIN_EMAILS (src/firebase.ts) et les règles Firestore.
create schema if not exists adrien_da_silva;

create or replace function adrien_da_silva.is_site_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'iss' = 'https://securetoken.google.com/artist-portfolio-28ba9'
    and auth.jwt() ->> 'aud' = 'artist-portfolio-28ba9'
    and (auth.jwt() ->> 'email_verified')::boolean
    and lower(auth.jwt() ->> 'email') in ('adrien.enaer@gmail.com', 'myriam.ajabi@gmail.com'),
    false
  );
$$;

revoke all on function adrien_da_silva.is_site_admin() from public;

grant usage on schema adrien_da_silva to anon, authenticated;
grant execute on function adrien_da_silva.is_site_admin() to anon, authenticated;

-- 3. Règles sur les fichiers. Les jetons Firebase n'ont pas le rôle « authenticated »
--    (il faudrait une Cloud Function payante) : ils arrivent en « anon », d'où les deux rôles.
--    Sans jeton Firebase valide, is_site_admin() vaut false : rien ne passe.
drop policy if exists "adrien-da-silva: admins envoient" on storage.objects;
create policy "adrien-da-silva: admins envoient" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'adrien-da-silva' and adrien_da_silva.is_site_admin());

drop policy if exists "adrien-da-silva: admins remplacent" on storage.objects;
create policy "adrien-da-silva: admins remplacent" on storage.objects
  for update to anon, authenticated
  using (bucket_id = 'adrien-da-silva' and adrien_da_silva.is_site_admin())
  with check (bucket_id = 'adrien-da-silva' and adrien_da_silva.is_site_admin());

drop policy if exists "adrien-da-silva: admins suppriment" on storage.objects;
create policy "adrien-da-silva: admins suppriment" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'adrien-da-silva' and adrien_da_silva.is_site_admin());

-- Pas de règle SELECT : les images se lisent par leur adresse publique,
-- et personne ne peut lister le contenu du bucket.
