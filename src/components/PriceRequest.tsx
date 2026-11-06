import { useState } from 'react';
import type { Artwork } from '../data/defaultData';

/** Le prix n'est pas affiché : le visiteur laisse son contact et Adrien reçoit un e-mail. */
export default function PriceRequest({ artwork }: { artwork: Artwork }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [botcheck, setBotcheck] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    try {
      const res = await fetch('/api/price-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, contact, botcheck, id: artwork.id, work: [artwork.title.trim(), artwork.dimensions].filter(Boolean).join(', ') }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'sent') return <p className="price-request" role="status">Merci, Adrien vous répond très vite.</p>;

  if (!open) {
    return (
      <div className="price-request">
        <button type="button" className="btn btn-primary btn-block" id="price-btn" onClick={() => setOpen(true)}>Demander le prix</button>
      </div>
    );
  }

  return (
    <form className="pf-form price-request" onSubmit={send}>
      <input className="admin-input" required maxLength={120} autoComplete="name" placeholder="Votre nom" aria-label="Votre nom"
        value={name} onChange={e => setName(e.target.value)} />
      <input className="admin-input" required maxLength={200} autoComplete="email" placeholder="Votre e-mail ou téléphone" aria-label="Votre e-mail ou téléphone"
        value={contact} onChange={e => setContact(e.target.value)} />
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }}
        value={botcheck} onChange={e => setBotcheck(e.target.value)} />
      <button type="submit" className="btn btn-primary btn-block" disabled={state === 'sending'}>
        {state === 'sending' ? 'Envoi…' : 'Recevoir le prix'}
      </button>
      {state === 'error' && <p className="drive-error">L'envoi n'a pas marché. Vérifiez votre e-mail ou téléphone, puis réessayez.</p>}
    </form>
  );
}
