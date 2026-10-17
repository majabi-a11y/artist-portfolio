/**
 * Envoi d'e-mails et liste d'abonnés via Brevo (clé secrète côté serveur uniquement).
 * Variables Vercel :
 *   BREVO_API_KEY      clé API Brevo (secrète)
 *   BREVO_SENDER       adresse d'expéditeur validée dans Brevo (ex. adrien.enaer@gmail.com)
 *   CONTACT_TO         destinataire des messages du site (Adrien)
 *   BREVO_LIST_ID      liste « Invitations » (facultatif : sans elle, pas d'inscription)
 */
const API = 'https://api.brevo.com/v3';
export const SITE_URL = 'https://adriendasilva.vercel.app';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable ${name} manquante`);
  return v;
}

async function brevo(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'api-key': env('BREVO_API_KEY'), 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  // 400 « duplicate_parameter » à l'inscription = déjà abonné : ce n'est pas une erreur
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    if (!/duplicate_parameter|Contact already exist/i.test(text)) throw new Error(`Brevo ${res.status}: ${text.slice(0, 200)}`);
  }
}

export function sendEmail(to: { email: string; name?: string }, subject: string, html: string, replyTo?: { email: string; name?: string }) {
  return brevo('/smtp/email', {
    sender: { email: env('BREVO_SENDER'), name: 'Adrien Da Silva' },
    to: [to],
    subject,
    htmlContent: html,
    ...(replyTo ? { replyTo } : {}),
  });
}

export async function subscribe(email: string, name?: string) {
  const list = Number(process.env.BREVO_LIST_ID);
  if (!list) return false;
  await brevo('/contacts', {
    email,
    ...(name ? { attributes: { PRENOM: name } } : {}),
    listIds: [list],
    updateEnabled: true,
  });
  return true;
}

export const contactTo = () => env('CONTACT_TO');

// ── Gabarits d'e-mails (HTML simple, lisible partout) ──

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function layout(inner: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f1ec;font-family:Georgia,serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fcfbf9">
<tr><td style="padding:28px 36px 0;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:3px;color:#7a716b">ADRIEN DA SILVA</td></tr>
<tr><td style="padding:8px 36px 0"><div style="height:1px;background:#e6e2dc"></div></td></tr>
${inner}
<tr><td style="padding:28px 36px 32px;font:11px/1.6 Helvetica,Arial,sans-serif;color:#9a928c">
Artiste peintre et muraliste — Montpellier · <a href="${SITE_URL}" style="color:#9a928c">adriendasilva.vercel.app</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;padding:14px 22px;background:#1a1a1a;color:#fcfbf9;text-decoration:none;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:2px">${label}</a>`;

export function confirmationEmail(name: string, subject: string, message: string, subscribed: boolean) {
  return layout(`
<tr><td style="padding:32px 36px 0">
  <img src="${SITE_URL}/icons/icon-192.png" width="56" height="56" alt="" style="display:block;margin-bottom:22px">
  <p style="font-size:24px;font-style:italic;margin:0 0 14px">Merci ${esc(name)},</p>
  <p style="font:15px/1.7 Helvetica,Arial,sans-serif;margin:0 0 18px;color:#3a3633">
    votre message est bien arrivé dans mon atelier. Je vous réponds personnellement, en général sous quelques jours.</p>
  <div style="border-left:2px solid #e6e2dc;padding:4px 0 4px 14px;margin:0 0 26px;font:13px/1.6 Helvetica,Arial,sans-serif;color:#7a716b">
    <strong style="color:#3a3633">${esc(subject)}</strong><br>${esc(message).replace(/\n/g, '<br>')}</div>
</td></tr>
<tr><td style="padding:0 36px">
  <div style="background:#1a1a1a;color:#f2ede8;padding:26px 24px">
    <p style="font-size:20px;font-style:italic;margin:0 0 10px">${subscribed ? 'Vous êtes sur la liste des invités' : 'Envie de suivre l\'atelier ?'}</p>
    <p style="font:13px/1.7 Helvetica,Arial,sans-serif;margin:0 0 18px;color:#cfc8c1">
      ${subscribed
        ? 'Vous recevrez les invitations aux vernissages et les nouvelles œuvres avant tout le monde.'
        : 'Installez l\'app sur votre téléphone : nouvelles toiles, fresques en cours et invitations aux vernissages, directement en notification.'}</p>
    <a href="${SITE_URL}/?bienvenue=${subscribed ? 'invite' : 'app'}" style="display:inline-block;padding:13px 20px;background:#f2ede8;color:#1a1a1a;text-decoration:none;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:2px">INSTALLER L'APP</a>
  </div>
</td></tr>`);
}

export function welcomeEmail(name?: string) {
  return layout(`
<tr><td style="padding:32px 36px 0">
  <img src="${SITE_URL}/icons/icon-192.png" width="56" height="56" alt="" style="display:block;margin-bottom:22px">
  <p style="font-size:24px;font-style:italic;margin:0 0 14px">Bienvenue${name ? ` ${esc(name)}` : ''} parmi les invités</p>
  <p style="font:15px/1.7 Helvetica,Arial,sans-serif;margin:0 0 22px;color:#3a3633">
    Vous recevrez les invitations aux vernissages et les nouvelles œuvres en avant-première.
    Pour être prévenu au moment même, installez l'app : elle tient sur l'écran d'accueil de votre téléphone.</p>
  ${button(`${SITE_URL}/?bienvenue=invite`, "INSTALLER L'APP")}
  <p style="font:12px/1.6 Helvetica,Arial,sans-serif;margin:22px 0 0;color:#9a928c">
    Un lien de désinscription figure dans chaque invitation.</p>
</td></tr>`);
}

export function messageToArtist(p: { name: string; email: string; subject: string; message: string; subscribed: boolean }) {
  return layout(`
<tr><td style="padding:28px 36px 0;font:14px/1.7 Helvetica,Arial,sans-serif;color:#3a3633">
  <p style="font-size:20px;font-style:italic;font-family:Georgia,serif;margin:0 0 12px">${esc(p.subject)}</p>
  <p style="margin:0 0 6px"><strong>${esc(p.name)}</strong> — <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
  <p style="margin:0 0 16px;color:#7a716b">${p.subscribed ? 'S\'est inscrit(e) aux invitations.' : 'Pas inscrit(e) aux invitations.'}</p>
  <div style="border-left:2px solid #e6e2dc;padding-left:14px">${esc(p.message).replace(/\n/g, '<br>')}</div>
  <p style="margin:18px 0 0;color:#9a928c;font-size:12px">Répondre à cet e-mail répond directement à ${esc(p.name)}.</p>
</td></tr>`);
}
