// sw.js – service worker pro Kartao.cz

const CACHE_NAME = 'kartao-v2'; // bump verze, aby se natáhl nový SW

const ASSETS_TO_CACHE = [
  '/',                 // root
  '/index.html',

  // stránky které skutečně existují:
  '/zalozit-kartu.html',
  '/moje-karta.html',
  '/moje-firma.html',
  '/moje-vyhry.html',
  '/login.html',

  // skripty – jen ty, které reálně existují v kořeni
  '/firebase-config.js',
  '/firebase-init.js',
  '/hamburger-menu.js',
  // případně přidej další existující soubory
];

// Instalace service workeru – přednačtení základních assetů
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
  self.clients.claim();
});

// Fetch — obsluhujeme JEN stejné origin, nic z cizích domén
self.addEventListener('fetch', event => {
  const req = event.request;

  // Cacheujeme jen GET dotazy
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // Když není stejný origin (Firebase, Google, Tailwind...), vůbec se do toho nepleteme
  if (url.origin !== self.location.origin) {
    return; // necháme to normálně přes síť, bez respondWith
  }

  // Pro naše HTML/CSS/JS: cache-first s fallbackem na síť
  event.respondWith(
    caches.match(req).then(cacheRes => {
      if (cacheRes) {
        return cacheRes;
      }

      return fetch(req)
        .then(networkRes => {
          // Uložíme do cache pro příště (jen když je OK odpověď)
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(req, resClone);
            });
          }
          return networkRes;
        })
        .catch(() => {
          // Fallback – když se nepodaří síť ani cache, zkusíme index.html
          if (req.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline'
          });
        });
    })
  );
});
