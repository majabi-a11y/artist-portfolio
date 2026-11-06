import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Download, EllipsisVertical, MonitorDown, Share, SquarePlus, X } from 'lucide-react';
import { canPromptInstall, enableNotifications, isIOS, isStandalone, notificationsGranted, onInstallChange, promptInstall } from '../lib/invite';

const CLOSED = 'ads-nudge-ferme';
const PAUSE = 30 * 24 * 3600 * 1000; // une barre fermée se tait 30 jours
const DELAY = 6000; // le temps de regarder le site d'abord

const paused = () => {
  try { return Date.now() - Number(localStorage.getItem(CLOSED) || 0) < PAUSE; } catch { return false; }
};
const canAsk = () => 'Notification' in window && Notification.permission === 'default';

/** Barre discrète : installer l'app depuis le site, puis activer les notifications depuis l'app installée. */
export default function InstallNudge() {
  const { pathname, search } = useLocation();
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(paused);
  const [installable, setInstallable] = useState(canPromptInstall());
  const [steps, setSteps] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), DELAY);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => onInstallChange(() => setInstallable(canPromptInstall())), []);

  const close = () => {
    setClosed(true);
    try { localStorage.setItem(CLOSED, String(Date.now())); } catch { /* navigation privée */ }
  };

  const hidden = !ready || closed || done || pathname === '/admin' || pathname === '/desinscription' || search.includes('bienvenue');
  if (hidden) return null;

  // App installée : il ne reste que les notifications
  if (isStandalone()) {
    if (notificationsGranted() || !canAsk()) return null;
    return (
      <aside className="install-nudge" aria-label="Notifications">
        <p>Soyez prévenu des nouvelles toiles et des expos.</p>
        <button type="button" className="install-nudge-go" onClick={async () => { await enableNotifications(); setDone(true); }}>
          <Bell size={14} /> Activer
        </button>
        <button type="button" className="install-nudge-close" aria-label="Fermer" onClick={close}><X size={16} /></button>
      </aside>
    );
  }

  const ios = isIOS();
  // Android n'envoie pas toujours son signal d'installation : on montre alors les gestes
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (!installable && !ios && !touch) return null;

  return (
    <aside className="install-nudge" aria-label="Installer l'app">
      {steps ? (
        <ol className="install-nudge-steps">
          {ios
            ? <li><Share size={15} /> Touchez <strong>Partager</strong></li>
            : <li><EllipsisVertical size={15} /> Ouvrez le <strong>menu</strong> du navigateur</li>}
          {ios
            ? <li><SquarePlus size={15} /> Puis <strong>Sur l'écran d'accueil</strong></li>
            : <li><MonitorDown size={15} /> Puis <strong>Installer et créer un raccourci</strong></li>}
        </ol>
      ) : (
        <>
          <p>Gardez l'atelier sur votre écran d'accueil.</p>
          <button type="button" className="install-nudge-go" onClick={async () => {
            if (installable) { if (await promptInstall()) setDone(true); } else setSteps(true);
          }}>
            <Download size={14} /> Installer l'app
          </button>
        </>
      )}
      <button type="button" className="install-nudge-close" aria-label="Fermer" onClick={close}><X size={16} /></button>
    </aside>
  );
}
