import { useEffect, useState } from 'react';
import { Bell, Check, Download, Share } from 'lucide-react';
import {
  canPromptInstall, enableNotifications, isIOS, isStandalone, notificationsGranted, onInstallChange, promptInstall,
} from '../lib/invite';
import { firstName, joinInvitations, signInVisitor, useVisitor } from '../lib/visitor';

interface Props {
  /** Déjà inscrit (ex. case cochée dans le formulaire de contact) : on passe directement à l'app */
  subscribed?: boolean;
  /** Proposer l'inscription (Google, ou e-mail en repli) */
  withEmail?: boolean;
  compact?: boolean;
}

const JOINED = 'ads-invite';
const remembered = () => { try { return localStorage.getItem(JOINED) === '1'; } catch { return false; } };
const remember = () => { try { localStorage.setItem(JOINED, '1'); } catch { /* navigation privée */ } };

/**
 * « Soyez de la prochaine expo » : invitations, installation de l'app, notifications.
 * Connecté avec Google : rien à taper. Sinon : un bouton Google, et l'e-mail seulement si on le préfère.
 */
export default function InviteCard({ subscribed = false, withEmail = true, compact = false }: Props) {
  const user = useVisitor();
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(subscribed || remembered() ? 'done' : 'idle');
  const [installable, setInstallable] = useState(canPromptInstall());
  const [standalone] = useState(isStandalone());
  const [ios] = useState(isIOS());
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [notif, setNotif] = useState(notificationsGranted());

  useEffect(() => onInstallChange(() => setInstallable(canPromptInstall())), []);

  const finish = (ok: boolean) => { if (ok) remember(); setState(ok ? 'done' : 'error'); };

  const joinWithGoogle = async () => {
    setState('sending');
    try {
      const u = user ?? await signInVisitor();
      if (!u?.email) { setState('idle'); return; } // redirection en cours, ou fenêtre fermée
      finish(await joinInvitations(u.email, u.displayName ?? undefined, 'google'));
    } catch {
      setState('idle'); // fenêtre Google fermée : rien de grave
    }
  };

  const joinWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState('sending');
    finish(await joinInvitations(email, undefined, 'site'));
  };

  const install = async () => {
    if (installable) await promptInstall();
    else if (ios) setShowIosSteps(s => !s);
  };

  const canInstall = !standalone && (installable || ios);
  const name = firstName(user);
  const done = state === 'done';

  return (
    <section className={`invite-card ${compact ? 'is-compact' : ''}`}>
      <img src="/icons/icon-192.png" alt="" className="invite-sun" />
      <h3 className="invite-title">
        {done ? (name ? `${name}, vous êtes sur la liste des invités` : 'Vous êtes sur la liste des invités') : 'Soyez de la prochaine expo'}
      </h3>

      {!done && (
        <ul className="invite-perks">
          <li>Invitations aux vernissages</li>
          <li>Nouvelles toiles en avant-première</li>
          <li>Fresques en cours, depuis l'échafaudage</li>
        </ul>
      )}

      {withEmail && !done && (
        <div className="invite-join">
          <button className="invite-google" onClick={joinWithGoogle} disabled={state === 'sending'}>
            <GoogleMark />
            {state === 'sending' ? '…' : user ? `M'inviter avec ${user.email}` : 'Recevoir les invitations avec Google'}
          </button>

          {!user && (showEmail ? (
            <form className="invite-form" onSubmit={joinWithEmail}>
              <input type="email" required placeholder="Votre e-mail" value={email} onChange={e => setEmail(e.target.value)}
                aria-label="Votre e-mail" autoComplete="email" autoFocus />
              <button type="submit" disabled={state === 'sending'}>M'inviter</button>
            </form>
          ) : (
            <button className="invite-alt" onClick={() => setShowEmail(true)}>ou avec mon adresse e-mail</button>
          ))}

          {state === 'error' && <p className="invite-error">L'inscription n'a pas fonctionné, réessayez dans un instant.</p>}
          <p className="invite-legal">Un e-mail par invitation, pas plus. Désinscription en un clic.</p>
        </div>
      )}

      {done && withEmail && !subscribed && (
        <p className="invite-ok"><Check size={14} /> C'est noté.</p>
      )}

      {(canInstall || !notif) && (
        <div className="invite-actions">
          {canInstall && (
            <button className="invite-btn" onClick={install}>
              <Download size={15} strokeWidth={1.6} /> Installer l'app
            </button>
          )}
          {!notif && 'Notification' in window && (
            <button className="invite-btn is-ghost" onClick={async () => setNotif(await enableNotifications())}>
              <Bell size={15} strokeWidth={1.6} /> Me prévenir des nouveautés
            </button>
          )}
        </div>
      )}
      {notif && <p className="invite-ok"><Check size={14} /> Notifications activées.</p>}

      {showIosSteps && (
        <ol className="invite-ios">
          <li>Touchez <Share size={13} /> <strong>Partager</strong> en bas de Safari</li>
          <li>Choisissez <strong>« Sur l'écran d'accueil »</strong></li>
          <li>Ouvrez l'app depuis l'icône soleil, puis activez les notifications</li>
        </ol>
      )}
    </section>
  );
}

/** Logo « G » de Google (couleurs officielles), requis à côté d'un bouton de connexion Google. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
