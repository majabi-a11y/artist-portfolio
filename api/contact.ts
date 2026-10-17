import { sendEmail, subscribe, contactTo, confirmationEmail, messageToArtist, mailReady } from './_mail.js';

/** Formulaire de contact (envoyé depuis le Gmail d'Adrien) : message à Adrien + confirmation au visiteur (+ inscription s'il l'a demandée). */
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, 'Requête illisible'); }

  if (body.botcheck) return json(200, 'ok'); // robot : on fait comme si
  const name = String(body.name ?? '').trim().slice(0, 120);
  const email = String(body.email ?? '').trim().slice(0, 200);
  const subject = String(body.subject ?? 'Contact').trim().slice(0, 120);
  const message = String(body.message ?? '').trim().slice(0, 5000);
  const wantsInvites = body.invitations === true;
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, 'Champs incomplets');

  try {
    const subscribed = wantsInvites ? await subscribe(email, name, 'contact') : false;
    // Gmail pas encore branché : le site ouvre la messagerie du visiteur à la place
    if (!mailReady()) return json(503, 'Envoi direct pas encore activé', { subscribed });
    await sendEmail({ email: contactTo(), name: 'Adrien Da Silva' }, `Site — ${subject} — ${name}`,
      messageToArtist({ name, email, subject, message, subscribed }), { email, name });
    await sendEmail({ email, name }, 'Votre message est bien arrivé', confirmationEmail(name, subject, message, subscribed));
    return json(200, 'ok', { subscribed });
  } catch (e) {
    console.error('contact', e);
    return json(502, 'Envoi impossible');
  }
}

function json(status: number, message: string, extra: object = {}) {
  return new Response(JSON.stringify({ ok: status === 200, message, ...extra }), {
    status, headers: { 'content-type': 'application/json' },
  });
}
