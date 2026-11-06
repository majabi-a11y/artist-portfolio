import { unsubscribe } from './_mail.js';

/** Désinscription : page du site (bouton) ou « Se désabonner » de Gmail (en-tête List-Unsubscribe). */
export async function POST(request: Request): Promise<Response> {
  const fromUrl = new URL(request.url).searchParams.get('t');
  const body = fromUrl ? {} : await request.json().catch(() => ({}));
  const jeton = String(fromUrl ?? (body as { t?: unknown }).t ?? '');
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(jeton)) return json(400);
  try {
    await unsubscribe(jeton); // même réponse si le lien a déjà servi : rien à apprendre ici
    return json(200);
  } catch (e) {
    console.error('désinscription', e);
    return json(502);
  }
}

const json = (status: number) =>
  new Response(JSON.stringify({ ok: status === 200 }), { status, headers: { 'content-type': 'application/json' } });
