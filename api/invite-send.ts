import { adminEmail, inviteList, invitationEmail, mailReady, paint, sendEmail, sendInvitations, withUnsubscribe } from './_mail.js';

const MAX_RECIPIENTS = 450; // Gmail limite à 500 destinataires par jour
const SAMPLE = '00000000-0000-0000-0000-000000000000'; // aperçu et test : le lien ne retire personne

/** Invitation écrite dans l'admin : aperçu, test sur l'adresse de l'admin, ou envoi à tous les invités. */
export async function POST(request: Request): Promise<Response> {
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer /, '');
  const admin = token ? await adminEmail(token).catch(() => null) : null;
  if (!admin) return json(401, { error: 'Réservé aux admins connectés.' });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400, { error: 'Requête illisible.' }); }
  const title = String(body.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const message = String(body.message ?? '').trim().slice(0, 3000);
  const image = /^(\/|https:\/\/)/.test(String(body.image ?? '')) ? String(body.image) : undefined;
  const color = /^#[0-9a-f]{6}$/i.test(String(body.color)) ? String(body.color) : '#1a1a1a';
  const html = invitationEmail({ title: title || 'Titre de l’invitation', message: message || 'Votre message…', image });

  if (body.mode === 'preview') return json(200, { html: paint(withUnsubscribe(html, SAMPLE), color) });
  if (!title || !message) return json(400, { error: 'Il manque le titre ou le message.' });
  if (!mailReady()) return json(503, { error: 'Le Gmail d’Adrien n’est pas branché.' });

  try {
    if (body.mode === 'test') {
      await sendEmail({ email: admin }, `[Test] ${title}`, withUnsubscribe(html, SAMPLE), undefined, color);
      return json(200, { sent: 1 });
    }
    if (body.mode !== 'send') return json(400, { error: 'Action inconnue.' });
    const invites = await inviteList(token, String(body.group ?? '') || undefined);
    if (!invites.length) return json(400, { error: 'Aucun invité dans la liste.' });
    if (invites.length > MAX_RECIPIENTS) return json(400, { error: `Plus de ${MAX_RECIPIENTS} invités : Gmail refuserait l’envoi.` });
    return json(200, await sendInvitations(invites, title, html, color));
  } catch (e) {
    console.error('invitation', e);
    return json(502, { error: 'Gmail ou la liste n’a pas répondu.' });
  }
}

const json = (status: number, payload: object) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
