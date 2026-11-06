import { confirmationEmail, contactTo, mailReady, priceRequestEmail, SITE_URL, sendEmail } from './_mail.js';

/** Bouton « Demander le prix » : le visiteur laisse son contact, Adrien reçoit un e-mail. */
export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(400); }
  if (body.botcheck) return json(200); // robot : on fait comme si

  const name = String(body.name ?? '').trim().slice(0, 120);
  const contact = String(body.contact ?? '').trim().slice(0, 200);
  const work = String(body.work ?? '').trim().slice(0, 160);
  const id = String(body.id ?? '').replace(/[^\w-]/g, '').slice(0, 120);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = !contact.includes('@') && contact.replace(/\D/g, '').length >= 8;
  if (!name || !work || !id || (!isEmail && !isPhone)) return json(400);
  if (!mailReady()) return json(503);

  try {
    const subject = `Demande de prix : ${work}`;
    await sendEmail({ email: contactTo(), name: 'Adrien Da Silva' }, `Site — ${subject} — ${name}`,
      priceRequestEmail({ name, contact, work, link: `${SITE_URL}/catalogue/${id}` }),
      isEmail ? { email: contact, name } : undefined);
    if (isEmail) {
      await sendEmail({ email: contact, name }, 'Votre demande est bien arrivée',
        confirmationEmail(name, subject, `Vous souhaitez connaître le prix de ${work}.`, false))
        .catch(e => console.error('confirmation prix', e));
    }
    return json(200);
  } catch (e) {
    console.error('demande de prix', e);
    return json(502);
  }
}

const json = (status: number) =>
  new Response(JSON.stringify({ ok: status === 200 }), { status, headers: { 'content-type': 'application/json' } });
