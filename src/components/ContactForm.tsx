import { useEffect, useState } from 'react';
import { Send, Loader2, Copy, Check } from 'lucide-react';
import InviteCard from './InviteCard';
import { signInVisitor, signOutVisitor, useVisitor } from '../lib/visitor';

export type ContactSubject =
  | { type: 'buy'; artworkTitle: string }
  | { type: 'quote'; fresqueTitle?: string }
  | { type: 'free' }
  | { type: 'collaboration' };

const SUBJECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'buy', label: 'Acheter une œuvre' },
  { value: 'quote', label: 'Demander un devis (fresque)' },
  { value: 'collaboration', label: 'Proposition de collaboration' },
  { value: 'free', label: 'Autre demande' },
];

interface Props {
  preset?: ContactSubject;
  contactEmail: string;
}

export default function ContactForm({ preset, contactEmail }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(() => {
    if (!preset) return 'free';
    return preset.type === 'buy' ? 'buy' : preset.type === 'quote' ? 'quote' : preset.type;
  });
  const [details, setDetails] = useState(() => {
    if (!preset) return '';
    if (preset.type === 'buy') return `Je suis intéressé(e) par l'œuvre "${preset.artworkTitle}".`;
    if (preset.type === 'quote') return preset.fresqueTitle ? `Demande de devis pour un projet similaire à "${preset.fresqueTitle}".` : '';
    return '';
  });
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const subjectLabel = SUBJECT_OPTIONS.find(o => o.value === subject)?.label || 'Contact';
  const fullMessage = `Nom: ${name}\nEmail: ${email}\nObjet: ${subjectLabel}\n\n${details}`;

  // Visiteur connecté avec Google : nom et e-mail viennent de son compte
  const user = useVisitor();
  useEffect(() => {
    if (user?.email) { setEmail(user.email); setName(n => n || user.displayName || ''); }
  }, [user]);

  const [useOtherEmail, setUseOtherEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [botcheck, setBotcheck] = useState(false); // champ piège invisible : coché = robot
  const [invitations, setInvitations] = useState(false); // consentement explicite, jamais coché d'office
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email && !useOtherEmail) { setError('Choisissez Google ou une adresse e-mail.'); return; }
    if (!name || !email || !details) { setError('Veuillez remplir tous les champs.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Cette adresse e-mail ne semble pas valide.'); return; }
    setError('');

    // Envoi par le serveur du site : message à Adrien + e-mail de confirmation au visiteur
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, subject: subjectLabel, message: details, invitations, botcheck }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) { setSubscribed(Boolean(json.subscribed)); setDelivered(true); return; }
    } catch {
      // réseau coupé : repli ci-dessous
    } finally {
      setSending(false);
    }

    // Repli : ouvrir la messagerie du visiteur
    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(subjectLabel)}&body=${encodeURIComponent(fullMessage)}`;
    window.open(mailtoUrl, '_blank');

    // Show confirmation with copy option
    setSent(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `À: ${contactEmail}\nObjet: ${subjectLabel}\n\n${fullMessage}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = `À: ${contactEmail}\nObjet: ${subjectLabel}\n\n${fullMessage}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (delivered) {
    return (
      <div className="contact-delivered">
        <div className="contact-delivered-head">
          <span className="contact-delivered-check"><Check size={18} /></span>
          <div>
            <p className="contact-delivered-title">Message envoyé</p>
            <p className="contact-delivered-text">Un e-mail de confirmation vous attend à {email}. Adrien vous répond personnellement.</p>
          </div>
        </div>
        <InviteCard subscribed={subscribed} withEmail={!subscribed} compact />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="contact-form-success" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>✓</div>
        <p style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: '16px' }}>Message prêt à envoyer</p>

        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
          Si votre client email ne s'est pas ouvert, vous pouvez copier le message
          et l'envoyer manuellement à :
        </p>

        <a href={`mailto:${contactEmail}`}
          style={{ fontSize: '0.82rem', color: 'var(--color-accent)', textDecoration: 'underline', display: 'block', marginBottom: '16px' }}>
          {contactEmail}
        </a>

        <button onClick={handleCopy} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier le message</>}
        </button>

        <button onClick={() => setSent(false)}
          style={{ display: 'block', margin: '12px auto 0', fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Modifier le message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-field">
        <label className="contact-form-label">Objet</label>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="contact-form-input">
          {SUBJECT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {user?.email ? (
        <div className="contact-identity">
          {user.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
          <span>
            <strong>{user.displayName || user.email}</strong>
            <small>{user.email}</small>
          </span>
          <button type="button" onClick={() => { signOutVisitor(); setEmail(''); setName(''); }}>Changer</button>
        </div>
      ) : !useOtherEmail ? (
        <div className="contact-who">
          <p className="contact-form-label">Qui écrit ?</p>
          <button type="button" className="invite-google" onClick={() => signInVisitor().catch(() => {})}>
            <GoogleG /> Continuer avec Google
          </button>
          <button type="button" className="invite-alt" onClick={() => setUseOtherEmail(true)}>
            ou avec une autre adresse e-mail
          </button>
        </div>
      ) : null}

      {!user?.email && useOtherEmail && <>
      <div className="contact-form-field">
        <label className="contact-form-label">Nom</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="contact-form-input" placeholder="Votre nom" autoComplete="name" required />
      </div>

      <div className="contact-form-field">
        <label className="contact-form-label">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="contact-form-input" placeholder="votre@email.com" autoComplete="email" required />
      </div>
      </>}

      <div className="contact-form-field">
        <label className="contact-form-label">Message</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)}
          className="contact-form-input contact-form-textarea" placeholder="Votre message..."
          rows={5} required />
      </div>

      {error && <p style={{ fontSize: '0.72rem', color: '#e53e3e', marginBottom: '10px' }}>{error}</p>}

      <label className="contact-optin">
        <input type="checkbox" checked={invitations} onChange={e => setInvitations(e.target.checked)} />
        <span>
          <strong>M'inviter aux prochaines expos</strong>
          <small>Vernissages et nouvelles œuvres en avant-première. Désinscription en un clic.</small>
        </span>
      </label>

      <input type="checkbox" name="botcheck" checked={botcheck} onChange={e => setBotcheck(e.target.checked)}
        tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />

      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }} disabled={sending}>
        {sending ? <><Loader2 size={14} className="spin" /> Envoi…</> : <><Send size={14} /> Envoyer</>}
      </button>
    </form>
  );
}

/** Logo « G » de Google (couleurs officielles), à côté du bouton de connexion. */
function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
