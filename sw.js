// sw.js – service worker pro Kartao.cz

const CACHE_NAME = 'kartao-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',

  // stránky které skutečně existují:
  '/zalozit-kartu.html',
  '/moje-karta.html',
  '/moje-firma.html',
  '/moje-vyhry.html',
  '/login.html',

  // tvé skripty – jen ty které existují
  '/firebase-config.js',
  '/firebase-init.js',
  '/hamburger-menu.js',
  // případně přidej další reálné soubory, ale nic navíc!
];

// Instalace service workeru
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktivace + odstranění starých cache
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch — síť > fallback cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
