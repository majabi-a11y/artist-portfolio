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

export async function sendEmail(to: { email: string; name?: string }, subject: string, html: string, replyTo?: { email: string; name?: string }) {
  await mailer().sendMail({
    from: { name: 'Adrien Da Silva', address: env('GMAIL_USER') },
    to: to.name ? { name: to.name, address: to.email } : to.email,
    subject,
    html,
    ...(replyTo ? { replyTo: replyTo.name ? { name: replyTo.name, address: replyTo.email } : replyTo.email } : {}),
  });
}

/** Ajoute (ou met à jour) un invité. */
export async function subscribe(email: string, name?: string, source: 'site' | 'contact' = 'site'): Promise<boolean> {
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
