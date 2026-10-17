-- Site d'Adrien Da Silva — liste des invités (vernissages, nouvelles œuvres).
-- Projet Supabase personnel « Aïoli doggy ». À coller dans le SQL Editor, puis « Run ». Rejouable.
-- La table reste dans le schéma adrien_da_silva (non exposé) ; on n'y accède que par deux fonctions :
--   adrien_da_silva_inscrire : ouverte à tous, n'écrit qu'une ligne (jamais de lecture) ;
--   adrien_da_silva_invites  : lecture réservée aux admins du site (jeton Firebase, cf. 0001).

create schema if not exists adrien_da_silva;

create table if not exists adrien_da_silva.invites (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  nom text check (length(nom) <= 120),
  source text not null default 'site' check (source in ('site', 'contact')),
  inscrit_le timestamptz not null default now()
);
alter table adrien_da_silva.invites enable row level security; -- aucune règle : pas d'accès direct

create or replace function public.adrien_da_silva_inscrire(p_email text, p_nom text default null, p_source text default 'site')
returns boolean
language sql
security definer
set search_path = ''
as $$
  insert into adrien_da_silva.invites (email, nom, source)
  values (lower(trim(p_email)), nullif(trim(p_nom), ''), coalesce(p_source, 'site'))
  on conflict (email) do update set nom = coalesce(excluded.nom, adrien_da_silva.invites.nom)
  returning true;
$$;

create or replace function public.adrien_da_silva_invites()
returns table (email text, nom text, source text, inscrit_le timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select i.email, i.nom, i.source, i.inscrit_le
  from adrien_da_silva.invites i
  where adrien_da_silva.is_site_admin()
  order by i.inscrit_le desc;
$$;

revoke all on function public.adrien_da_silva_inscrire(text, text, text) from public;
revoke all on function public.adrien_da_silva_invites() from public;
grant execute on function public.adrien_da_silva_inscrire(text, text, text) to anon, authenticated;
grant execute on function public.adrien_da_silva_invites() to anon, authenticated;
