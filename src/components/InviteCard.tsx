import { useEffect, useState } from 'react';
import { Bell, Check, Download, Share } from 'lucide-react';
import {
  canPromptInstall, enableNotifications, isIOS, isStandalone, notificationsGranted, onInstallChange, promptInstall,
} from '../lib/invite';

interface Props {
  /** Déjà inscrit (ex. case cochée dans le formulaire de contact) : on passe directement à l'app */
  subscribed?: boolean;
  /** Afficher le champ e-mail d'inscription */
  withEmail?: boolean;
  compact?: boolean;
}

/**
 * « Soyez de la prochaine expo » : inscription aux invitations, installation de l'app, notifications.
 * Chaque étape n'apparaît que si elle a un sens sur l'appareil (pas d'installation proposée dans l'app installée…).
 */
export default function InviteCard({ subscribed = false, withEmail = true, compact = false }: Props) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(subscribed ? 'done' : 'idle');
  const [installable, setInstallable] = useState(canPromptInstall());
  const [standalone] = useState(isStandalone());
  const [ios] = useState(isIOS());
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [notif, setNotif] = useState(notificationsGranted());
  const [botcheck, setBotcheck] = useState(false);

  useEffect(() => onInstallChange(() => setInstallable(canPromptInstall())), []);

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setState('sending');
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, botcheck }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  const install = async () => {
    if (installable) await promptInstall();
    else if (ios) setShowIosSteps(s => !s);
  };

  const canInstall = !standalone && (installable || ios);

  return (
    <section className={`invite-card ${compact ? 'is-compact' : ''}`}>
      <img src="/icons/icon-192.png" alt="" className="invite-sun" />
      <h3 className="invite-title">{state === 'done' ? 'Vous êtes sur la liste des invités' : 'Soyez de la prochaine expo'}</h3>

      {state !== 'done' && (
        <ul className="invite-perks">
          <li>Invitations aux vernissages</li>
          <li>Nouvelles toiles en avant-première</li>
          <li>Fresques en cours, depuis l'échafaudage</li>
        </ul>
      )}

      {withEmail && state !== 'done' && (
        <form className="invite-form" onSubmit={join}>
          <input type="email" required placeholder="Votre e-mail" value={email} onChange={e => setEmail(e.target.value)}
            aria-label="Votre e-mail" autoComplete="email" />
          <input type="checkbox" checked={botcheck} onChange={e => setBotcheck(e.target.checked)} tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />
          <button type="submit" disabled={state === 'sending'}>{state === 'sending' ? '…' : 'Je veux être invité(e)'}</button>
          {state === 'error' && <p className="invite-error">L'inscription n'a pas fonctionné, réessayez dans un instant.</p>}
          <p className="invite-legal">Un e-mail par invitation, pas plus. Désinscription en un clic.</p>
        </form>
      )}

      {state === 'done' && withEmail && !subscribed && (
        <p className="invite-ok"><Check size={14} /> C'est noté. Un e-mail de bienvenue est en route.</p>
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
