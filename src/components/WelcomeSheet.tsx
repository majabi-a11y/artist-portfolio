import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import InviteCard from './InviteCard';

/** Arrivée depuis l'e-mail (« Installer l'app » → /?bienvenue=invite ou =app) : la carte d'installation s'ouvre d'elle-même. */
export default function WelcomeSheet() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // « invite » : déjà inscrit (e-mail de bienvenue) ; sinon on propose aussi l'inscription
  const subscribed = new URLSearchParams(location.search).get('bienvenue') === 'invite';

  useEffect(() => {
    if (new URLSearchParams(location.search).has('bienvenue')) setOpen(true);
  }, [location.search]);

  if (!open) return null;
  const close = () => {
    setOpen(false);
    const params = new URLSearchParams(location.search);
    params.delete('bienvenue');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  return (
    <div className="welcome-sheet" onClick={close}>
      <div className="welcome-sheet-body" onClick={e => e.stopPropagation()}>
        <button className="welcome-close" onClick={close} aria-label="Fermer"><X size={18} /></button>
        <InviteCard subscribed={subscribed} withEmail={!subscribed} />
      </div>
    </div>
  );
}
