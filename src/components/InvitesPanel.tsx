import { useState } from 'react';
import { Users, Copy, Check } from 'lucide-react';
import { supabase } from '../supabase';

interface Invite { email: string; nom: string | null; source: string; inscrit_le: string }

/** Admin : liste des invités (inscrits depuis le site ou le formulaire) et copie des adresses pour Gmail. */
export default function InvitesPanel() {
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
              </li>
            ))}
          </ul>
        </>
      )}
      {error && <p className="drive-error">{error}</p>}
    </section>
  );
}
