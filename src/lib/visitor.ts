/**
 * Connexion Google des visiteurs (même Firebase Auth que l'admin, sans aucun droit d'écriture).
 * Sert à ne rien faire taper : prénom et e-mail viennent du compte Google.
 */
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { isStandalone } from './invite';

export function useVisitor(): User | null {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  return user;
}

export const firstName = (u: User | null) => u?.displayName?.split(' ')[0] ?? '';

/** Fenêtre Google ; dans l'app installée (où les fenêtres s'ouvrent mal), redirection. */
export async function signInVisitor(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (isStandalone()) {
    try { sessionStorage.setItem(PENDING, '1'); } catch { /* rien */ }
    await signInWithRedirect(auth, provider);
    return null;
  }
  return (await signInWithPopup(auth, provider)).user;
}

export const signOutVisitor = () => signOut(auth);

// Retour de la redirection Google (app installée) : on termine l'inscription demandée avant de partir
const PENDING = 'ads-invite-pending';
if (typeof window !== 'undefined') {
  getRedirectResult(auth).then(async (result) => {
    let pending = false;
    try { pending = sessionStorage.getItem(PENDING) === '1'; sessionStorage.removeItem(PENDING); } catch { /* rien */ }
    const u = result?.user;
    if (pending && u?.email && await joinInvitations(u.email, u.displayName ?? undefined, 'google')) {
      try { localStorage.setItem('ads-invite', '1'); } catch { /* rien */ }
    }
  }).catch(() => { /* pas de redirection en cours */ });
}

/** Inscription aux invitations (l'adresse vient du compte Google ou du champ e-mail). */
export async function joinInvitations(email: string, name: string | undefined, source: 'site' | 'google'): Promise<boolean> {
  try {
    const res = await fetch('/api/invitations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, name, source }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
