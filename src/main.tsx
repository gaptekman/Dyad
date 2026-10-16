import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './compact.css';
import './exercise-images.css';
import './simple.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if ('serviceWorker' in navigator && import.meta.env?.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then(registration => registration.update()).catch(console.error);
    navigator.serviceWorker.ready.then(registration => {
      registration.active?.postMessage({ type: 'CACHE_OFFLINE_ASSETS' });
    }).catch(console.error);
  });
}
