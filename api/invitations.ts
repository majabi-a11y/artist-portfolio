import { sendEmail, subscribe, welcomeEmail, withUnsubscribe, mailReady } from './_mail.js';

/** Inscription à la liste « invitations aux expos » (sans passer par le formulaire de contact). */
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400); }
  if (body.botcheck) return json(200);
  const email = String(body.email ?? '').trim().slice(0, 200);
  const name = String(body.name ?? '').trim().slice(0, 120) || undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400);
  try {
    const source = body.source === 'google' ? 'google' : 'site';
    const jeton = await subscribe(email, name, source);
    // L'e-mail de bienvenue est un plus : son échec ne doit pas annuler l'inscription
    if (mailReady()) {
      await sendEmail({ email, name }, 'Vous êtes sur la liste des invités', withUnsubscribe(welcomeEmail(name), jeton))
        .catch(e => console.error('bienvenue', e));
    }
    return json(200);
  } catch (e) {
    console.error('invitations', e);
    return json(502);
  }
}

const json = (status: number) =>
  new Response(JSON.stringify({ ok: status === 200 }), { status, headers: { 'content-type': 'application/json' } });
