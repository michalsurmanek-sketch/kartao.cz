// sw.js – service worker pro Kartao.cz

const CACHE_NAME = 'kartao-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/zalozit-kartu.html',
  '/moje-karta.html',
  '/moje-firma.html',
  '/moje-vyhry.html',
  '/login.html',
  '/firebase-config.js',
  '/firebase-init.js',
  '/hamburger-menu.js',
];

// Instalace – nacacheujeme jen naše statické soubory
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Aktivace – smažeme staré cache
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch – obsluhujeme jen požadavky na náš vlastní web (kartao.cz)
// VŠE ostatní (Firebase, Google, atd.) necháme jít přímo na síť.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jen same-origin (náš web)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        // když máme v cache → vrátíme, jinak jdeme na síť
        return cached || fetch(event.request);
      })
    );
  }
  // cizí domény vůbec neřešíme – prohlížeč je vyřídí sám
});

