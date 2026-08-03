import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './tema.css';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta el nodo #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Solo en producción: en desarrollo el service worker sirve archivos viejos y
// uno termina mirando un cambio que ya no está en el código.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}
