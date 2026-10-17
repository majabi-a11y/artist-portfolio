import { useState } from 'react';
import { Send, Loader2, Copy, Check } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !details) { setError('Veuillez remplir tous les champs.'); return; }
    setError('');

    // Try mailto
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

      <div className="contact-form-field">
        <label className="contact-form-label">Nom</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="contact-form-input" placeholder="Votre nom" required />
      </div>

      <div className="contact-form-field">
        <label className="contact-form-label">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="contact-form-input" placeholder="votre@email.com" required />
      </div>

      <div className="contact-form-field">
        <label className="contact-form-label">Message</label>
        <textarea value={details} onChange={e => setDetails(e.target.value)}
          className="contact-form-input contact-form-textarea" placeholder="Votre message..."
          rows={5} required />
      </div>

      {error && <p style={{ fontSize: '0.72rem', color: '#e53e3e', marginBottom: '10px' }}>{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '8px' }}>
        <Send size={14} /> Envoyer
      </button>
    </form>
  );
}
