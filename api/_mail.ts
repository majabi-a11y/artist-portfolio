/**
 * E-mails envoyés depuis le Gmail d'Adrien (mot de passe d'application Google, côté serveur uniquement)
 * et liste des invités dans Supabase (supabase/migrations/0002_invitations.sql).
 * Variables Vercel :
 *   GMAIL_USER          adresse Gmail d'Adrien (expéditeur)
 *   GMAIL_APP_PASSWORD  mot de passe d'application Google (16 lettres, secret)
 *   CONTACT_TO          destinataire des messages du site (Adrien)
 */
import nodemailer from 'nodemailer';

export const SITE_URL = 'https://adriendasilva.vercel.app';
const SUPABASE_URL = 'https://wtfutafhjfnkdqignlzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-Z8ZjW0oASENwp0SnlmD-w_jOw0Q-ph'; // clé publique (déjà dans le site)

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variable ${name} manquante`);
  return v;
}

let transport: nodemailer.Transporter | null = null;
const mailer = () => (transport ??= nodemailer.createTransport({
  service: 'gmail',
  auth: { user: env('GMAIL_USER'), pass: env('GMAIL_APP_PASSWORD').replace(/\s/g, '') },
}));

const FIREBASE_KEY = 'AIzaSyBVK6S7_YlDH7jNJayGl5c4j15TX4VxpSI'; // clé publique (déjà dans le site)
const SITE_DOC = 'https://firestore.googleapis.com/v1/projects/artist-portfolio-28ba9/databases/(default)/documents/site/data';
const ADMIN_EMAILS = ['adrien.enaer@gmail.com', 'myriam.ajabi@gmail.com'];
const DEFAULT_COLOR = '#1a1a1a';
const isColor = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

/** Couleur des e-mails choisie dans l'admin (document public du site). */
async function savedColor(): Promise<string> {
  try {
    const doc = await (await fetch(`${SITE_DOC}?mask.fieldPaths=mailColor`)).json();
    const color = doc.fields?.mailColor?.stringValue;
    return isColor(color) ? color : DEFAULT_COLOR;
  } catch {
    return DEFAULT_COLOR;
  }
}

/** Les gabarits portent des repères ; on y met la couleur, et un texte lisible par-dessus. */
export function paint(html: string, color: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const on = 0.3 * r + 0.59 * g + 0.11 * b > 150 ? '#1a1a1a' : '#fcfbf9';
  return html.replaceAll(ACCENT, color).replaceAll(ON, on);
}

/** Adresse de l'admin connecté, vérifiée auprès de Google ; null pour tout autre appel. */
export async function adminEmail(idToken: string): Promise<string | null> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_KEY}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }),
  });
  if (!res.ok) return null;
  const user = (await res.json()).users?.[0];
  const email = String(user?.email ?? '').toLowerCase();
  return user?.emailVerified && ADMIN_EMAILS.includes(email) ? email : null;
}

/** Adresses des invités, lues avec le jeton de l'admin (la base ne les donne qu'à lui). */
export async function inviteEmails(idToken: string): Promise<string[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/adrien_da_silva_invites`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { email: string }[]).map(i => i.email);
}

/** Invitation : les invités en copie cachée, personne ne voit les autres adresses. */
export async function sendBcc(bcc: string[], subject: string, html: string, color: string) {
  await mailer().sendMail({
    from: { name: 'Adrien Da Silva', address: env('GMAIL_USER') },
    to: env('GMAIL_USER'),
    bcc,
    subject,
    html: paint(html, color),
  });
}

export async function sendEmail(to: { email: string; name?: string }, subject: string, rawHtml: string, replyTo?: { email: string; name?: string }, color?: string) {
  const html = paint(rawHtml, color ?? await savedColor());
  await mailer().sendMail({
    from: { name: 'Adrien Da Silva', address: env('GMAIL_USER') },
    to: to.name ? { name: to.name, address: to.email } : to.email,
    subject,
    html,
    ...(replyTo ? { replyTo: replyTo.name ? { name: replyTo.name, address: replyTo.email } : replyTo.email } : {}),
  });
}

/** Ajoute (ou met à jour) un invité. */
export async function subscribe(email: string, name?: string, source: 'site' | 'contact' | 'google' = 'site'): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/adrien_da_silva_inscrire`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_email: email, p_nom: name ?? null, p_source: source }),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return true;
}

export const contactTo = () => env('CONTACT_TO');

/** Le Gmail d'Adrien est-il branché ? (sans mot de passe d'application : pas d'envoi, le reste marche) */
export const mailReady = () => Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && process.env.CONTACT_TO);

// ── Gabarits d'e-mails (HTML simple, lisible partout) ──

const ACCENT = '%%ACCENT%%';
const ON = '%%ON%%';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function layout(inner: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f1ec;font-family:Georgia,serif;color:#1a1a1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fcfbf9">
<tr><td style="padding:28px 36px 0;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:3px;color:${ACCENT}">ADRIEN DA SILVA</td></tr>
<tr><td style="padding:8px 36px 0"><div style="height:1px;background:#e6e2dc"></div></td></tr>
${inner}
<tr><td style="padding:28px 36px 32px;font:11px/1.6 Helvetica,Arial,sans-serif;color:#9a928c">
Artiste peintre et muraliste — Montpellier · <a href="${SITE_URL}" style="color:#9a928c">adriendasilva.vercel.app</a></td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;padding:14px 22px;background:${ACCENT};color:${ON};text-decoration:none;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:2px">${label}</a>`;

export function confirmationEmail(name: string, subject: string, message: string, subscribed: boolean) {
  return layout(`
<tr><td style="padding:32px 36px 0">
  <img src="${SITE_URL}/icons/icon-192.png" width="56" height="56" alt="" style="display:block;margin-bottom:22px">
  <p style="font-size:24px;font-style:italic;margin:0 0 14px;color:${ACCENT}">Merci ${esc(name)},</p>
  <p style="font:15px/1.7 Helvetica,Arial,sans-serif;margin:0 0 18px;color:#3a3633">
    votre message est bien arrivé dans mon atelier. Je vous réponds personnellement, en général sous quelques jours.</p>
  <div style="border-left:2px solid #e6e2dc;padding:4px 0 4px 14px;margin:0 0 26px;font:13px/1.6 Helvetica,Arial,sans-serif;color:#7a716b">
    <strong style="color:#3a3633">${esc(subject)}</strong><br>${esc(message).replace(/\n/g, '<br>')}</div>
</td></tr>
<tr><td style="padding:0 36px">
  <div style="background:${ACCENT};color:${ON};padding:26px 24px">
    <p style="font-size:20px;font-style:italic;margin:0 0 10px">${subscribed ? 'Vous êtes sur la liste des invités' : 'Envie de suivre l\'atelier ?'}</p>
    <p style="font:13px/1.7 Helvetica,Arial,sans-serif;margin:0 0 18px;color:${ON}">
      ${subscribed
        ? 'Vous recevrez les invitations aux vernissages et les nouvelles œuvres avant tout le monde.'
        : 'Installez l\'app sur votre téléphone : nouvelles toiles, fresques en cours et invitations aux vernissages, directement en notification.'}</p>
    <a href="${SITE_URL}/?bienvenue=${subscribed ? 'invite' : 'app'}" style="display:inline-block;padding:13px 20px;background:${ON};color:${ACCENT};text-decoration:none;font:12px/1 Helvetica,Arial,sans-serif;letter-spacing:2px">INSTALLER L'APP</a>
  </div>
</td></tr>`);
}

export function welcomeEmail(name?: string) {
  return layout(`
<tr><td style="padding:32px 36px 0">
  <img src="${SITE_URL}/icons/icon-192.png" width="56" height="56" alt="" style="display:block;margin-bottom:22px">
  <p style="font-size:24px;font-style:italic;margin:0 0 14px;color:${ACCENT}">Bienvenue${name ? ` ${esc(name)}` : ''} parmi les invités</p>
  <p style="font:15px/1.7 Helvetica,Arial,sans-serif;margin:0 0 22px;color:#3a3633">
    Vous recevrez les invitations aux vernissages et les nouvelles œuvres en avant-première.
    Pour être prévenu au moment même, installez l'app : elle tient sur l'écran d'accueil de votre téléphone.</p>
  ${button(`${SITE_URL}/?bienvenue=invite`, "INSTALLER L'APP")}
  <p style="font:12px/1.6 Helvetica,Arial,sans-serif;margin:22px 0 0;color:#9a928c">
    Pour ne plus rien recevoir, répondez simplement « stop » à cet e-mail.</p>
</td></tr>`);
}

export function invitationEmail(p: { title: string; message: string; image?: string }) {
  const image = p.image ? (p.image.startsWith('/') ? `${SITE_URL}${p.image}` : p.image) : '';
  return layout(`
<tr><td style="padding:32px 36px 0">
  ${image ? `<img src="${esc(image)}" width="488" alt="" style="display:block;width:100%;height:auto;margin-bottom:24px">` : ''}
  <p style="font-size:24px;font-style:italic;margin:0 0 14px;color:${ACCENT}">${esc(p.title)}</p>
  <p style="font:15px/1.7 Helvetica,Arial,sans-serif;margin:0 0 22px;color:#3a3633">${esc(p.message).replace(/\n/g, '<br>')}</p>
  ${button(SITE_URL, 'VOIR LE SITE')}
  <p style="font:12px/1.6 Helvetica,Arial,sans-serif;margin:22px 0 0;color:#9a928c">
    Pour ne plus rien recevoir, répondez simplement « stop » à cet e-mail.</p>
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
