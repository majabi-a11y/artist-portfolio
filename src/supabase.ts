import { createClient } from '@supabase/supabase-js';
import { auth } from './firebase';

/**
 * Photos envoyées depuis l'admin : Supabase Storage, projet personnel « Aïoli doggy »,
 * bucket « adrien-da-silva » (supabase/migrations/0001_images.sql).
 * Supabase accepte le jeton Firebase de la personne connectée (Third-Party Auth) :
 * les règles du bucket n'autorisent que les adresses de ADMIN_EMAILS.
 * La clé « anon » est publique par nature, comme la configuration Firebase.
 */
export const SUPABASE_URL = 'https://wtfutafhjfnkdqignlzk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_-Z8ZjW0oASENwp0SnlmD-w_jOw0Q-ph';
export const IMAGES_BUCKET = 'adrien-da-silva';

export const supabase = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      accessToken: async () => (await auth.currentUser?.getIdToken()) ?? null,
    })
  : null;

const MAX_SIDE = 2400;

/** Réduit une photo trop grande (2400 px au plus) et la convertit en WebP haute qualité. */
async function prepare(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === 'image/gif') return { blob: file, ext: 'gif', type: file.type };
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/webp', 0.92));
  return blob ? { blob, ext: 'webp', type: 'image/webp' } : { blob: file, ext: file.name.split('.').pop() || 'jpg', type: file.type };
}

export async function uploadToSupabase(file: File, folder: string): Promise<string> {
  if (!supabase) throw new Error('Stockage des photos pas encore configuré (clé Supabase manquante).');
  const { blob, ext, type } = await prepare(file);
  const base = file.name.replace(/\.[^.]+$/, '').normalize('NFKD').replace(/[^\w-]+/g, '-').slice(0, 40) || 'image';
  const path = `${folder}/${Date.now()}-${base}.${ext}`;
  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, blob, { contentType: type, upsert: false });
  if (error) throw error;
  return supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
