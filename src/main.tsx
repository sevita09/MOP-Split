import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { pedirQueNoBorreLosDatos } from './utiles/almacenamiento';
import './tema.css';

const raiz = document.getElementById('raiz');
if (!raiz) throw new Error('Falta el nodo #raiz en index.html');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sin esto el navegador trata lo guardado como descartable y lo borra cuando
// el celular anda corto de espacio: ahí se pierde la conexión a la planilla y
// hay que volver a pegar el código familiar.
void pedirQueNoBorreLosDatos();

// Solo en producción: en desarrollo el service worker sirve archivos viejos y
// uno termina mirando un cambio que ya no está en el código.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  });
}
