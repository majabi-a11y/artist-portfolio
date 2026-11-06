/**
 * Contacts du compte Google d'Adrien, lus depuis le navigateur (People API, lecture seule).
 * « Autres contacts » = les personnes à qui il a écrit, gardées automatiquement par Gmail.
 * Rien n'est enregistré ici : seules les adresses qu'il coche partent dans la liste des invités.
 */
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

const PEOPLE = 'https://people.googleapis.com/v1';

export interface Contact { email: string; name: string }

interface Person { names?: { displayName?: string }[]; emailAddresses?: { value?: string }[] }

async function pages(url: string, key: 'otherContacts' | 'connections', token: string): Promise<Person[]> {
  const people: Person[] = [];
  let pageToken = '';
  do {
    const res = await fetch(`${url}&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Google a refusé la lecture des contacts (${res.status}).`);
    const body = await res.json();
    people.push(...(body[key] ?? []));
    pageToken = body.nextPageToken ?? '';
  } while (pageToken);
  return people;
}

export async function fetchContacts(): Promise<{ account: string; contacts: Contact[] }> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/contacts.other.readonly');
  provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken;
  if (!token) throw new Error('Google n’a pas donné accès aux contacts.');

  const [other, saved] = await Promise.all([
    pages(`${PEOPLE}/otherContacts?readMask=names,emailAddresses`, 'otherContacts', token),
    pages(`${PEOPLE}/people/me/connections?personFields=names,emailAddresses`, 'connections', token),
  ]);
  const byEmail = new Map<string, Contact>();
  for (const p of [...saved, ...other]) {
    const name = p.names?.[0]?.displayName ?? '';
    for (const e of p.emailAddresses ?? []) {
      const email = e.value?.trim().toLowerCase();
      // Les adresses automatiques ne sont pas des personnes
      if (!email || /no-?reply|ne-?pas-?repondre|mailer-daemon|notifications?@/.test(email)) continue;
      if (!byEmail.get(email)?.name) byEmail.set(email, { email, name });
    }
  }
  const contacts = [...byEmail.values()].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, 'fr'));
  return { account: result.user.email ?? '', contacts };
}
