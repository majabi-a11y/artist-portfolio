-- Site d'Adrien Da Silva — 0006 : le bucket accepte aussi les catalogues PDF (50 Mo au plus). Rejouable.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
where id = 'adrien-da-silva';
