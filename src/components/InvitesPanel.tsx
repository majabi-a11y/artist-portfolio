import { useEffect, useState } from 'react';
import { Users, Copy, Check, Send, Trash2 } from 'lucide-react';
import type { SiteData } from '../data/defaultData';
import { auth } from '../firebase';
import { supabase } from '../supabase';
import { ColorField } from './PortfolioEditor';

interface Invite { email: string; nom: string | null; source: string; inscrit_le: string }

interface Props {
  data: SiteData;
  replaceData: (next: SiteData) => void;
}

const COLORS = ['#1a1a1a', '#1d1aa8', '#ff5c9d', '#281c42'];
const COVER = '/portfolio/p/01.jpg';

/** Admin : liste des invités, envoi des invitations par le Gmail d'Adrien, couleur des e-mails. */
export default function InvitesPanel({ data, replaceData }: Props) {
  const color = data.mailColor ?? COLORS[0];
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState('');
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const works = data.artworks.filter(a => !a.draft && a.images?.[0]);

  const call = async (mode: 'preview' | 'test' | 'send') => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Connectez-vous pour envoyer.');
    const res = await fetch('/api/invite-send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ mode, title, message, image, color }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
    return body as { html?: string; sent?: number };
  };

  // Aperçu du vrai e-mail, un instant après la dernière frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      call('preview').then(r => setPreview(r.html ?? '')).catch(() => { /* pas connecté : pas d'aperçu */ });
    }, 500);
    return () => clearTimeout(timer);
  }, [title, message, image, color]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (mode: 'test' | 'send') => {
    if (mode === 'send' && !confirm(`Envoyer « ${title} » à tous les invités ? Un e-mail envoyé ne peut pas être repris.`)) return;
    setSending(true);
    setStatus('');
    try {
      const { sent } = await call(mode);
      setStatus(mode === 'test' ? 'Test envoyé sur votre adresse.' : `Invitation envoyée à ${sent} invité${sent === 1 ? '' : 's'}.`);
    } catch (err) {
      setStatus(`Envoi impossible : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    } finally {
      setSending(false);
    }
  };

  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setError('');
    if (!supabase) return setError('Supabase non configuré.');
    const { data, error } = await supabase.rpc('adrien_da_silva_invites');
    if (error) setError(error.message);
    else setInvites(data as Invite[]);
  };

  const remove = async (email: string) => {
    if (!supabase || !confirm(`Retirer ${email} de la liste des invités ?`)) return;
    setError('');
    const { error } = await supabase.rpc('adrien_da_silva_retirer', { p_email: email });
    if (error) setError(error.message);
    else setInvites(list => list?.filter(i => i.email !== email) ?? null);
  };

  const copyAll = async () => {
    if (!invites?.length) return;
    await navigator.clipboard.writeText(invites.map(i => i.email).join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="drive-panel">
      <div className="drive-head">
        <Users size={16} strokeWidth={1.5} />
        <h2>Invités</h2>
        {invites && <span className="drive-badge">{invites.length}</span>}
      </div>
      {!invites ? (
        <button className="btn btn-outline btn-sm" onClick={load}>Afficher la liste des invités</button>
      ) : invites.length === 0 ? (
        <p className="drive-hint">Personne pour l'instant.</p>
      ) : (
        <>
          <p className="drive-hint">
            Pour une invitation : copiez les adresses et collez-les en <strong>Cci</strong> dans Gmail
            (jamais en « À », pour que personne ne voie les autres invités).
          </p>
          <button className="btn btn-primary btn-sm" onClick={copyAll}>
            {copied ? <><Check size={13} /> Copié</> : <><Copy size={13} /> Copier les {invites.length} adresses</>}
          </button>
          <ul className="invites-list">
            {invites.map(i => (
              <li key={i.email}>
                <span>{i.nom ? `${i.nom} — ` : ''}{i.email}</span>
                <small>{new Date(i.inscrit_le).toLocaleDateString('fr-FR')} · {i.source === 'contact' ? 'formulaire' : 'site'}</small>
                <button type="button" className="invite-remove" aria-label={`Retirer ${i.email}`} onClick={() => remove(i.email)}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </>
      )}
      {error && <p className="drive-error">{error}</p>}

      <div className="pf-form" style={{ marginTop: 20 }}>
        <span className="drive-label">Envoyer une invitation</span>
        <input className="admin-input" placeholder="Titre : Vernissage le 12 décembre" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="admin-input" rows={5} placeholder="Message : date, lieu, horaires…" maxLength={3000} value={message} onChange={e => setMessage(e.target.value)} />
        <select className="admin-input" aria-label="Image de l'invitation" value={image} onChange={e => setImage(e.target.value)}>
          <option value="">Sans image</option>
          {works.map(a => <option key={a.id} value={a.images[0]}>{a.title.trim()}</option>)}
        </select>
        <ColorField label="Couleur des e-mails (invitations et e-mails automatiques)" swatches={COLORS} value={color} cover={COVER} used={[]}
          onChange={c => replaceData({ ...data, mailColor: c })} />
        <p className="drive-hint">La couleur s'applique aux e-mails automatiques après « Sauvegarder ».</p>
        {preview && <iframe className="invite-preview" title="Aperçu de l'e-mail" srcDoc={preview} sandbox="" />}
        <div className="pf-actions">
          <button type="button" className="btn btn-outline btn-sm" disabled={sending || !title.trim() || !message.trim()} onClick={() => send('test')}>
            <Send size={13} /> M'envoyer un test
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={sending || !title.trim() || !message.trim()} onClick={() => send('send')}>
            <Send size={13} /> {sending ? 'Envoi…' : 'Envoyer à tous les invités'}
          </button>
        </div>
        {status && <p className="drive-hint" role="status">{status}</p>}
      </div>
    </section>
  );
}
