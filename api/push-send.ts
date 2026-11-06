import { adminEmail } from './_mail.js';

const APP_ID = 'b224b657-b135-4fb7-b942-82277aebd8d6'; // identifiant public OneSignal (déjà dans le site)

/** Notification de l'app, envoyée depuis l'admin : la clé OneSignal reste sur le serveur. */
export async function POST(request: Request): Promise<Response> {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const admin = token ? await adminEmail(token).catch(() => null) : null;
  if (!admin) return json(401, { error: 'Réservé aux admins connectés.' });

  const key = process.env.ONESIGNAL_REST_KEY;
  if (!key) return json(503, { error: 'La clé OneSignal n’est pas encore dans Vercel.' });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { error: 'Requête illisible.' }); }
  const title = String(body.title ?? '').trim().slice(0, 80);
  const message = String(body.message ?? '').trim().slice(0, 300);
  const url = String(body.url ?? '').trim();
  if (!title || !message) return json(400, { error: 'Titre et message requis.' });
  if (url && !url.startsWith('https://')) return json(400, { error: 'Le lien doit commencer par https://' });

  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `${key.startsWith('os_v2_') ? 'Key' : 'Basic'} ${key}` },
    body: JSON.stringify({
      app_id: APP_ID,
      included_segments: ['Total Subscriptions'],
      headings: { en: title, fr: title },
      contents: { en: message, fr: message },
      ...(url ? { url } : {}),
    }),
  });
  const result = await res.json().catch(() => ({})) as { id?: string; errors?: unknown };
  if (!res.ok) {
    console.error('notification', res.status, result);
    return json(502, { error: 'OneSignal a refusé l’envoi : vérifiez la clé.' });
  }
  // Sans abonné, OneSignal répond sans identifiant d'envoi
  if (!result.id) return json(200, { sent: false });
  return json(200, { sent: true });
}

const json = (status: number, payload: object) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
