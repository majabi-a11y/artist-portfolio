/**
 * Installer l'app (PWA) et activer les notifications (OneSignal), depuis n'importe quelle page.
 * L'événement d'installation de Chrome/Android n'arrive qu'une fois au chargement : on le garde ici.
 */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    listeners.forEach(l => l());
  });
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach(l => l()); });
}

export const onInstallChange = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const canPromptInstall = () => deferred !== null;

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Ouvre la fenêtre d'installation (Chrome, Edge, Android). Renvoie true si acceptée. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach(l => l());
  return outcome === 'accepted';
}

type OneSignalApi = { Notifications: { requestPermission: () => Promise<void>; permission: boolean } };
declare global { interface Window { OneSignalDeferred?: ((os: OneSignalApi) => void)[] } }

/** Demande l'autorisation des notifications (invitations, nouvelles œuvres). */
export function enableNotifications(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('Notification' in window)) return resolve(false);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.Notifications.requestPermission();
        resolve(OneSignal.Notifications.permission);
      } catch { resolve(false); }
    });
    setTimeout(() => resolve(Notification.permission === 'granted'), 15000);
  });
}

export const notificationsGranted = () => 'Notification' in window && Notification.permission === 'granted';
