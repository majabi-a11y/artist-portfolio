import './lib/invite'; // capte l'invitation à installer l'app dès le chargement
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Après une publication, une page restée en cache réclame des fichiers qui n'existent plus :
// on recharge une fois pour prendre la nouvelle version (sinon la page reste blanche).
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try {
    if (sessionStorage.getItem('ads-reload') === location.pathname) return;
    sessionStorage.setItem('ads-reload', location.pathname);
  } catch { /* navigation privée : on recharge quand même */ }
  location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
