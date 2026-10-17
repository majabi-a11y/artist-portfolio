/**
 * Import depuis le Drive partagé, lancé depuis l'admin (pas de serveur).
 *
 * Organisation attendue du dossier partagé (noms de dossiers libres en casse et accents) :
 *   Toiles/ · Papiers/ · Sérigraphies/ · Fresques/ · Journal/   (éventuellement rangés dans un dossier « Catalogue »)
 *     └─ un sous-dossier par œuvre (son nom devient le titre), avec toutes ses photos ;
 *        une photo posée directement dans la rubrique devient une œuvre à elle seule.
 * Chaque nouveauté crée une fiche BROUILLON (invisible sur le site) que l'admin fait compléter.
 * Les fichiers déjà importés sont mémorisés (driveImported) : jamais de doublon.
 */
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { uploadToSupabase } from '../supabase';
import type { Artwork, NewsPost, SiteData } from '../data/defaultData';

const DRIVE = 'https://www.googleapis.com/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
/** Formats que le navigateur sait lire ; les autres (HEIC…) sont signalés, pas importés. */
const READABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

type Rubrique = Artwork['category'] | 'journal';

/** Nom de dossier → rubrique du site. */
function rubriqueOf(name: string): Rubrique | null {
  const n = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/toile|peinture/.test(n)) return 'toile';
  if (/papier|dessin/.test(n)) return 'papier';
  if (/serigraph|estampe|edition/.test(n)) return 'serigraphie';
  if (/fresque|mural/.test(n)) return 'fresque';
  if (/journal|actu|news/.test(n)) return 'journal';
  if (/graphisme/.test(n)) return 'graphisme';
  if (/objet/.test(n)) return 'objets';
  return null;
}

/** Identifiant d'un dossier Drive à partir de son lien (ou l'identifiant lui-même). */
export function folderIdFromUrl(url: string): string | null {
  const m = url.match(/folders\/([\w-]{10,})/) || url.match(/[?&]id=([\w-]{10,})/) || url.match(/^([\w-]{10,})$/);
  return m ? m[1] : null;
}

/** Jeton Drive (lecture seule) : demandé par une fenêtre Google, valable une heure. */
export async function getDriveToken(): Promise<string> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.setCustomParameters({ login_hint: auth.currentUser?.email ?? '' });
  const result = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error("Google n'a pas donné l'accès au Drive.");
  return token;
}

interface DriveFile { id: string; name: string; mimeType: string; parents?: string[] }

async function list(token: string, folderId: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(`${DRIVE}/files?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(res.status === 404 ? 'Dossier Drive introuvable (lien ou partage ?).' : `Drive : erreur ${res.status}`);
    const json = await res.json();
    out.push(...json.files);
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);
  return out;
}

async function download(token: string, f: DriveFile): Promise<File> {
  const res = await fetch(`${DRIVE}/files/${f.id}?alt=media&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Téléchargement de « ${f.name} » impossible (${res.status}).`);
  return new File([await res.blob()], f.name, { type: f.mimeType });
}

const isImage = (f: DriveFile) => f.mimeType.startsWith('image/');
const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();

/** Une « pièce » à importer : une œuvre (ou une actu) et ses photos. */
interface Piece { key: string; title: string; rubrique: Rubrique; files: DriveFile[] }

async function collect(token: string, rootId: string): Promise<Piece[]> {
  const pieces: Piece[] = [];
  const walk = async (folderId: string, rubrique: Rubrique | null, depth: number) => {
    const items = await list(token, folderId);
    for (const it of items) {
      if (it.mimeType === FOLDER) {
        const r = rubriqueOf(it.name);
        if (r) await walk(it.id, r, depth + 1);           // rubrique (même rangée dans « Catalogue »)
        else if (rubrique) {                                // dossier d'une œuvre
          const files = (await list(token, it.id)).filter(isImage);
          if (files.length) pieces.push({ key: it.id, title: it.name.trim(), rubrique, files });
        } else if (depth < 2) await walk(it.id, null, depth + 1); // dossier de rangement (« Catalogue »…)
      } else if (rubrique && isImage(it)) {                 // photo seule dans une rubrique
        pieces.push({ key: it.id, title: titleFromFile(it.name), rubrique, files: [it] });
      }
    }
  };
  await walk(rootId, null, 0);
  return pieces;
}

export interface ImportReport {
  created: number;
  updated: number;
  photos: number;
  skipped: string[]; // fichiers non lisibles (HEIC…) : à exporter en JPEG
}

/**
 * Importe les nouveautés du Drive et renvoie les données mises à jour (à enregistrer ensuite).
 * `onProgress` reçoit un texte d'avancement pour l'admin.
 */
export async function importFromDrive(data: SiteData, onProgress: (msg: string) => void): Promise<{ data: SiteData; report: ImportReport }> {
  const rootId = data.driveFolderUrl ? folderIdFromUrl(data.driveFolderUrl) : null;
  if (!rootId) throw new Error('Collez d\'abord le lien du dossier Drive partagé.');

  onProgress('Connexion au Drive…');
  const token = await getDriveToken();
  onProgress('Lecture des dossiers…');
  const pieces = await collect(token, rootId);

  const imported = new Set(data.driveImported ?? []);
  const artworks = [...data.artworks];
  const news = [...data.news];
  const report: ImportReport = { created: 0, updated: 0, photos: 0, skipped: [] };

  for (const piece of pieces) {
    const fresh = piece.files.filter(f => !imported.has(f.id));
    if (!fresh.length) continue;

    const urls: string[] = [];
    for (const f of fresh) {
      if (!READABLE.includes(f.mimeType)) { report.skipped.push(`${piece.title} / ${f.name}`); continue; }
      onProgress(`Import de « ${piece.title} » (${urls.length + 1}/${fresh.length})…`);
      const folder = piece.rubrique === 'journal' ? 'journal' : piece.rubrique === 'fresque' ? 'fresques' : 'oeuvres';
      urls.push(await uploadToSupabase(await download(token, f), folder));
      imported.add(f.id);
      report.photos++;
    }
    if (!urls.length) continue;

    if (piece.rubrique === 'journal') {
      const i = news.findIndex(n => n.driveFolderId === piece.key);
      if (i >= 0) { news[i] = { ...news[i], images: [...news[i].images, ...urls] }; report.updated++; }
      else {
        const post: NewsPost = {
          id: `drive-${piece.key}`, title: piece.title, date: new Date().toISOString().slice(0, 10),
          content: '', images: urls, category: 'studio', draft: true, driveFolderId: piece.key,
        };
        news.unshift(post); report.created++;
      }
    } else {
      const i = artworks.findIndex(a => a.driveFolderId === piece.key);
      if (i >= 0) { artworks[i] = { ...artworks[i], images: [...artworks[i].images, ...urls] }; report.updated++; }
      else {
        const art: Artwork = {
          id: `drive-${piece.key}`, title: piece.title, technique: piece.rubrique === 'fresque' ? 'Fresque' : '',
          dimensions: '', description: '', images: urls, category: piece.rubrique,
          isFeatured: false, status: piece.rubrique === 'fresque' ? 'private' : 'available',
          draft: true, driveFolderId: piece.key,
        };
        artworks.push(art); report.created++;
      }
    }
  }

  return { data: { ...data, artworks, news, driveImported: [...imported] }, report };
}

// ── Champs à remplir avant publication ──

export function missingFields(item: Artwork | NewsPost): string[] {
  if ('content' in item) {
    return [!item.title.trim() && 'titre', !item.content.trim() && 'texte'].filter(Boolean) as string[];
  }
  const a = item;
  if (a.category === 'fresque') {
    return [!a.title.trim() && 'titre', !a.lieu?.trim() && 'lieu', !a.dimensions.trim() && 'dimensions'].filter(Boolean) as string[];
  }
  return [
    !a.title.trim() && 'titre',
    !a.technique.trim() && 'technique',
    !a.dimensions.trim() && 'dimensions',
    !a.year && 'année',
    a.status !== 'sold' && !a.price?.trim() && 'prix',
  ].filter(Boolean) as string[];
}
