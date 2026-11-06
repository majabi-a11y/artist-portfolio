-- Site d'Adrien Da Silva — 0005 : groupes d'invités et ajout depuis ses contacts Google. Rejouable.
alter table adrien_da_silva.invites add column if not exists groupe text check (length(groupe) <= 60);

alter table adrien_da_silva.invites drop constraint if exists invites_source_check;
alter table adrien_da_silva.invites
  add constraint invites_source_check check (source in ('site', 'contact', 'google', 'gmail'));

-- La liste renvoie maintenant le groupe : changer le type de retour impose de recréer la fonction.
drop function if exists public.adrien_da_silva_invites();
create function public.adrien_da_silva_invites()
returns table (email text, nom text, source text, groupe text, inscrit_le timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.email, i.nom, i.source, i.groupe, i.inscrit_le
  from adrien_da_silva.invites i
  where adrien_da_silva.is_site_admin()
  order by i.inscrit_le desc;
$$;

-- Ajoute des contacts choisis par l'admin, ou change le groupe d'adresses déjà inscrites.
create or replace function public.adrien_da_silva_ajouter(p_contacts jsonb, p_groupe text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  total integer;
begin
  if not adrien_da_silva.is_site_admin() then
    raise exception 'Réservé aux admins du site' using errcode = '42501';
  end if;
  insert into adrien_da_silva.invites (email, nom, source, groupe)
  select distinct on (lower(trim(c.email)))
    lower(trim(c.email)), nullif(left(trim(c.nom), 120), ''), 'gmail', nullif(left(trim(p_groupe), 60), '')
  from jsonb_to_recordset(p_contacts) as c(email text, nom text)
  where c.email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(c.email) <= 200
  on conflict (email) do update
    set groupe = excluded.groupe,
        nom = coalesce(adrien_da_silva.invites.nom, excluded.nom);
  get diagnostics total = row_count;
  return total;
end;
$$;

revoke all on function public.adrien_da_silva_invites() from public;
revoke all on function public.adrien_da_silva_ajouter(jsonb, text) from public;
grant execute on function public.adrien_da_silva_invites() to anon, authenticated;
grant execute on function public.adrien_da_silva_ajouter(jsonb, text) to anon, authenticated;
