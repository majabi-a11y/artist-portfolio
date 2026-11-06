import { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { supabase } from '../supabase';
import { fetchContacts, type Contact } from '../utils/googleContacts';

interface Props {
  known: string[];
  groups: string[];
  onAdded: () => void;
}

const SHOWN = 100;

/** Admin : Adrien coche, dans ses contacts Google, les personnes à inviter et leur donne un groupe. */
export default function ContactPicker({ known, groups, onAdded }: Props) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [account, setAccount] = useState('');
  const [picked, setPicked] = useState<Map<string, Contact>>(new Map());
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const open = async () => {
    setBusy(true);
    setStatus('');
    try {
      const found = await fetchContacts();
      setContacts(found.contacts);
      setAccount(found.account);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Lecture impossible.');
    } finally {
      setBusy(false);
    }
  };

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (contacts ?? []).filter(c => !known.includes(c.email) && (!q || `${c.name} ${c.email}`.toLowerCase().includes(q)));
  }, [contacts, known, search]);

  const toggle = (c: Contact) => setPicked(prev => {
    const next = new Map(prev);
    if (!next.delete(c.email)) next.set(c.email, c);
    return next;
  });

  const add = async () => {
    if (!supabase) return;
    setBusy(true);
    setStatus('');
    const list = [...picked.values()].map(c => ({ email: c.email, nom: c.name }));
    const { error } = await supabase.rpc('adrien_da_silva_ajouter', { p_contacts: list, p_groupe: group.trim() || null });
    setBusy(false);
    if (error) return setStatus(error.message);
    setStatus(`${list.length} ajouté${list.length > 1 ? 's' : ''} à la liste.`);
    setPicked(new Map());
    onAdded();
  };

  if (!contacts) {
    return (
      <div className="pf-form" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={open}>
          <UserPlus size={13} /> {busy ? 'Lecture…' : 'Choisir dans mes contacts Gmail'}
        </button>
        {status && <p className="drive-error">{status}</p>}
      </div>
    );
  }

  return (
    <div className="pf-form" style={{ marginTop: 16 }}>
      <span className="drive-label">Contacts de {account} ({contacts.length})</span>
      <input className="admin-input" placeholder="Chercher un nom ou une adresse" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="pf-list">
        {matches.slice(0, SHOWN).map(c => (
          <label key={c.email} className="pf-row">
            <span>{c.name ? `${c.name} — ` : ''}{c.email}</span>
            <input type="checkbox" checked={picked.has(c.email)} onChange={() => toggle(c)} />
          </label>
        ))}
      </div>
      {matches.length > SHOWN && <p className="drive-hint">{matches.length - SHOWN} autres : affinez la recherche.</p>}
      <input className="admin-input" list="invite-groups" maxLength={60} placeholder="Groupe (facultatif) : Galeries, Presse, Collectionneurs…"
        value={group} onChange={e => setGroup(e.target.value)} />
      <datalist id="invite-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
      <button type="button" className="btn btn-primary btn-sm" disabled={busy || !picked.size} onClick={add}>
        <UserPlus size={13} /> Ajouter {picked.size || ''} à la liste
      </button>
      {status && <p className="drive-hint" role="status">{status}</p>}
    </div>
  );
}
