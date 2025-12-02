// ==========================================
// KARTAO.CZ - SERVICE WORKER
// Profesionální cachování pro maximální rychlost
// ==========================================

const CACHE_VERSION = 'kartao-v1.0.0';
const CACHE_NAME = `kartao-cache-${CACHE_VERSION}`;

// ==========================================
// CO CACHOVAT
// ==========================================

// Statické assets - cache navždy
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  
  // Kritické stránky
  '/login.html',
  '/kartao-marketplace.html',
  '/kartao-pro-firmy.html',
  '/kartao-pro-tvurce.html',
  '/kartao-muj-ucet.html',
  '/vip.html',
  '/chat.html',
  '/kontakt.html',
  
  // Core JS
  '/supabase-config.js',
  '/supabase-init.js',
  '/auth-unified.js',
  '/hamburger-menu.js',
  '/credits-system-supabase.js',
  
  // Systémy
  '/notification-system.js',
  '/advanced-analytics.js',
  '/security-manager.js',
  '/internationalization-system.js',
  
  // CDN - fallback
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// API routes - cache s revalidací
const API_CACHE_PATTERNS = [
  /\/rest\/v1\/creators/,
  /\/rest\/v1\/firms/,
  /\/rest\/v1\/campaigns/,
  /\/rest\/v1\/reviews/
];

// Obrázky - cache dlouhodobě
const IMAGE_CACHE_PATTERNS = [
  /unsplash\.com/,
  /picsum\.photos/,
  /supabase\.co.*storage/
];

// ==========================================
// INSTALL - Stáhnout a uložit static assets
// ==========================================

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: Caching static assets');
      return cache.addAll(STATIC_CACHE.map(url => new Request(url, { cache: 'reload' })));
    })
    .then(() => {
      console.log('✅ Service Worker: Installed successfully');
      return self.skipWaiting(); // Aktivovat okamžitě
    })
    .catch((error) => {
      console.error('❌ Service Worker: Install failed', error);
    })
  );
});

// ==========================================
// ACTIVATE - Vyčistit staré cache
// ==========================================

self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker: Activated');
      return self.clients.claim(); // Převzít kontrolu okamžitě
    })
  );
});

// ==========================================
// FETCH - Inteligentní strategie cachování
// ==========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorovat non-GET requesty
  if (request.method !== 'GET') {
    return;
  }
  
  // Ignorovat chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // ========================================
  // STRATEGIE 1: Cache First (Static Assets)
  // ========================================
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // ========================================
  // STRATEGIE 2: Network First (API Data)
  // ========================================
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ========================================
  // STRATEGIE 3: Stale While Revalidate (Images)
  // ========================================
  if (isImage(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // ========================================
  // DEFAULT: Network First
  // ========================================
  event.respondWith(networkFirst(request));
});

// ==========================================
// CACHE STRATEGIE
// ==========================================

// Cache First - nejrychlejší pro statické soubory
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // console.log('✅ Cache hit:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('❌ Fetch failed:', request.url, error);
    // Fallback na offline stránku
    const offlinePage = await cache.match('/offline.html');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Network First - aktuální data s fallbackem
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const response = await fetch(request, { timeout: 3000 });
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log('⚠️ Network failed, serving from cache:', request.url);
      return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate - zobraz cache, aktualizuj na pozadí
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cached || fetchPromise;
}

// ==========================================
// HELPER FUNKCE
// ==========================================

function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.hostname === 'cdn.tailwindcss.com' ||
    url.hostname === 'cdn.jsdelivr.net'
  );
}

function isApiRequest(url) {
  return (
    url.hostname.includes('supabase.co') &&
    API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))
  );
}

function isImage(url) {
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i) ||
    IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(url.href))
  );
}

// ==========================================
// PUSH NOTIFICATIONS (připraveno pro budoucnost)
// ==========================================

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Kartao.cz';
  const options = {
    body: data.body || 'Máte novou notifikaci',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Otevřít' },
      { action: 'close', title: 'Zavřít' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// ==========================================
// BACKGROUND SYNC (připraveno pro budoucnost)
// ==========================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('🔄 Background sync started');
  // Implementace synchronizace dat
}

console.log('🚀 Kartao.cz Service Worker loaded');
