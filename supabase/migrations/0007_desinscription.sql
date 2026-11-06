-- Site d'Adrien Da Silva — 0007 : lien de désinscription personnel dans les e-mails. Rejouable.
-- Chaque invité a un jeton secret ; seul ce jeton permet de le retirer sans être admin.
alter table adrien_da_silva.invites add column if not exists jeton uuid not null default gen_random_uuid();
create unique index if not exists invites_jeton_key on adrien_da_silva.invites (jeton);

-- L'inscription renvoie le jeton (pour l'e-mail de bienvenue) : changer le type impose de recréer la fonction.
drop function if exists public.adrien_da_silva_inscrire(text, text, text);
create function public.adrien_da_silva_inscrire(p_email text, p_nom text default null, p_source text default 'site')
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into adrien_da_silva.invites (email, nom, source)
  values (lower(trim(p_email)), nullif(trim(p_nom), ''), coalesce(p_source, 'site'))
  on conflict (email) do update set nom = coalesce(excluded.nom, adrien_da_silva.invites.nom)
  returning jeton;
$$;

-- La liste (réservée aux admins) donne le jeton au serveur qui envoie les invitations.
drop function if exists public.adrien_da_silva_invites();
create function public.adrien_da_silva_invites()
returns table (email text, nom text, source text, groupe text, inscrit_le timestamptz, jeton uuid)
language sql
stable
security definer
set search_path = ''
as $$
  select i.email, i.nom, i.source, i.groupe, i.inscrit_le, i.jeton
  from adrien_da_silva.invites i
  where adrien_da_silva.is_site_admin()
  order by i.inscrit_le desc;
$$;

-- Ouverte à tous, mais il faut connaître le jeton : personne ne peut désinscrire quelqu'un d'autre.
create or replace function public.adrien_da_silva_desinscrire(p_jeton uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from adrien_da_silva.invites where jeton = p_jeton;
  return found;
end;
$$;

revoke all on function public.adrien_da_silva_inscrire(text, text, text) from public;
revoke all on function public.adrien_da_silva_invites() from public;
revoke all on function public.adrien_da_silva_desinscrire(uuid) from public;
grant execute on function public.adrien_da_silva_inscrire(text, text, text) to anon, authenticated;
grant execute on function public.adrien_da_silva_invites() to anon, authenticated;
grant execute on function public.adrien_da_silva_desinscrire(uuid) to anon, authenticated;
