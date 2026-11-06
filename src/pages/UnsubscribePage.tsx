import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Lien des e-mails : un bouton à confirmer, car les messageries ouvrent parfois les liens toutes seules. */
export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const jeton = params.get('t') ?? '';
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const confirm = async () => {
    setState('sending');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ t: jeton }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-content" style={{ paddingTop: '120px', paddingBottom: '120px', maxWidth: '480px' }}>
        <h1 className="artwork-title" style={{ fontSize: '1.7rem', marginBottom: '16px' }}>
          {state === 'done' ? 'C’est fait' : 'Ne plus recevoir les invitations'}
        </h1>
        {state === 'done' ? (
          <p className="fresque-text">Vous ne recevrez plus les invitations d’Adrien Da Silva.</p>
        ) : !jeton ? (
          <p className="fresque-text">Ce lien est incomplet. Utilisez celui de votre e-mail, ou répondez « stop » à cet e-mail.</p>
        ) : (
          <>
            <p className="fresque-text">Vous ne recevrez plus d’invitations aux expositions.</p>
            <button type="button" className="btn btn-primary btn-block" disabled={state === 'sending'} onClick={confirm}>
              {state === 'sending' ? 'Un instant…' : 'Me désinscrire'}
            </button>
            {state === 'error' && <p className="drive-error" style={{ marginTop: 12 }}>Ça n’a pas marché. Réessayez, ou répondez « stop » à l’e-mail.</p>}
          </>
        )}
      </div>
    </div>
  );
}
