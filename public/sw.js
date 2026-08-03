// Service worker escrito a mano: la app es chica y así no dependemos de un
// plugin que precachea por nosotros con nombres de archivo hasheados.

const CACHE = 'split-familiar-v1';
const RAIZ = '/MOP-Split/';

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([RAIZ])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;

  // Los POST a Apps Script van directo: cachearlos daría datos viejos y además
  // rompería el reintento cuando el celular recupera señal.
  if (peticion.method !== 'GET') return;
  if (new URL(peticion.url).origin !== self.location.origin) return;

  // Navegación: primero la red, para que un deploy nuevo se vea enseguida.
  // Si no hay señal, cae al índice cacheado y la app abre igual.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(RAIZ, copia));
          return respuesta;
        })
        .catch(() => caches.match(RAIZ)),
    );
    return;
  }

  evento.respondWith(
    caches.match(peticion).then((cacheada) => {
      if (cacheada) return cacheada;
      return fetch(peticion).then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      });
    }),
  );
});
