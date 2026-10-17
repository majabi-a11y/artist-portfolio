-- Site d'Adrien Da Silva — 0003 : provenance « google » pour les invités
-- (inscription d'un visiteur connecté avec Google). Rejouable.
alter table adrien_da_silva.invites drop constraint if exists invites_source_check;
alter table adrien_da_silva.invites
  add constraint invites_source_check check (source in ('site', 'contact', 'google'));
