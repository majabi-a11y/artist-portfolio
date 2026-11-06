-- Site d'Adrien Da Silva — 0004 : retirer un invité depuis l'admin. Rejouable.
-- Réservé aux admins du site (jeton Firebase, cf. 0001) ; ces jetons arrivent en « anon », d'où les deux rôles.
create or replace function public.adrien_da_silva_retirer(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not adrien_da_silva.is_site_admin() then
    raise exception 'Réservé aux admins du site' using errcode = '42501';
  end if;
  delete from adrien_da_silva.invites where email = lower(trim(p_email));
  return found;
end;
$$;

revoke all on function public.adrien_da_silva_retirer(text) from public;
grant execute on function public.adrien_da_silva_retirer(text) to anon, authenticated;
