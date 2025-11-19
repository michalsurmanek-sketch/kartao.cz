const CACHE_NAME = 'kartao-v1';
const STATIC_CACHE_NAME = 'kartao-static-v1';
const DYNAMIC_CACHE_NAME = 'kartao-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/kartao-marketplace.html',
    '/kartao-muj-ucet.html',
    '/kartao-pro-tvurce.html',
    '/kartao-pro-firmy.html',
    '/login.html',
    '/kartao-marketplace.html',
    '/rewards-followers-dashboard.html',
    '/ai-pricing-dashboard.html',
    '/ai-analytics-dashboard.html',
    '/leaderboards-dashboard.html',
    '/badge-system-dashboard.html',
    '/comments-dashboard.html',
    '/ecommerce-dashboard.html',
    '/world-class-statistics-dashboard.html',
    '/intelligent-recommendation-dashboard.html',
    '/company-mini-websites-dashboard.html',
    '/ai-price-negotiation-dashboard.html',
    '/firebase-init.js',
    '/notification-system.js',
    '/live-chat-system.js',
    '/manifest.json'
];

const CACHE_STRATEGIES = {
    // Cache first for static assets
    CACHE_FIRST: 'cache-first',
    // Network first for dynamic content
    NETWORK_FIRST: 'network-first',
    // Stale while revalidate for frequently updated content
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            }),
            self.skipWaiting()
        ])
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activated');
    
    event.waitUntil(
        Promise.all([
            // Delete old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName.startsWith('kartao-') && 
                                   cacheName !== STATIC_CACHE_NAME && 
                                   cacheName !== DYNAMIC_CACHE_NAME;
                        })
                        .map(cacheName => {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            }),
            self.clients.claim()
        ])
    );
});

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests (except CDN)
    if (url.origin !== location.origin && !isAllowedExternal(url.hostname)) {
        return;
    }

    event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Determine strategy based on request
    const strategy = getRequestStrategy(request);
    
    switch (strategy) {
        case CACHE_STRATEGIES.CACHE_FIRST:
            return cacheFirst(request);
        case CACHE_STRATEGIES.NETWORK_FIRST:
            return networkFirst(request);
        case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
            return staleWhileRevalidate(request);
        default:
            return networkFirst(request);
    }
}

function getRequestStrategy(request) {
    const url = new URL(request.url);
    
    // Static assets - cache first
    if (STATIC_ASSETS.includes(url.pathname)) {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }
    
    // JavaScript and CSS files - cache first
    if (request.destination === 'script' || request.destination === 'style') {
        return CACHE_STRATEGIES.CACHE_FIRST;
    }
    
    // Images - stale while revalidate
    if (request.destination === 'image') {
        return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
    }
    
    // API calls and Firebase - network first
    if (url.pathname.includes('/api/') || url.hostname.includes('firebase')) {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }
    
    // HTML pages - network first with cache fallback
    if (request.destination === 'document') {
        return CACHE_STRATEGIES.NETWORK_FIRST;
    }
    
    // Default to network first
    return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Cache First Strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        
        // Return offline page for HTML requests
        if (request.destination === 'document') {
            return caches.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        
        throw error;
    }
}

// Network First Strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('Network failed, trying cache:', request.url);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.destination === 'document') {
            return caches.match('/offline.html') || new Response('Offline', { status: 503 });
        }
        
        throw error;
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    // Update cache in background
    const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200) {
            const cache = caches.open(DYNAMIC_CACHE_NAME);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(error => {
        console.error('Background fetch failed:', error);
    });
    
    // Return cached version immediately, or wait for network
    return cachedResponse || fetchPromise;
}

// Helper function to check allowed external domains
function isAllowedExternal(hostname) {
    const allowedDomains = [
        'cdn.tailwindcss.com',
        'unpkg.com',
        'www.gstatic.com',
        'firebase.googleapis.com',
        'firestore.googleapis.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'picsum.photos'
    ];
    
    return allowedDomains.some(domain => hostname.includes(domain));
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'background-sync-messages') {
        event.waitUntil(syncOfflineMessages());
    }
    
    if (event.tag === 'background-sync-analytics') {
        event.waitUntil(syncOfflineAnalytics());
    }
});

async function syncOfflineMessages() {
    try {
        // Get offline messages from IndexedDB
        const db = await openDB();
        const tx = db.transaction(['offline-messages'], 'readonly');
        const store = tx.objectStore('offline-messages');
        const messages = await store.getAll();
        
        for (const message of messages) {
            try {
                // Send message to server
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message.data)
                });
                
                if (response.ok) {
                    // Remove from offline storage
                    const deleteTx = db.transaction(['offline-messages'], 'readwrite');
                    const deleteStore = deleteTx.objectStore('offline-messages');
                    await deleteStore.delete(message.id);
                }
            } catch (error) {
                console.error('Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncOfflineAnalytics() {
    try {
        // Sync analytics data
        console.log('Syncing offline analytics...');
    } catch (error) {
        console.error('Analytics sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', event => {
    console.log('📲 Push message received');
    
    const options = {
        body: 'Máte novou zprávu na Kartao.cz',
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: 'Otevřít',
                icon: '/icon-open.png'
            },
            {
                action: 'dismiss',
                title: 'Zavřít',
                icon: '/icon-close.png'
            }
        ]
    };
    
    if (event.data) {
        try {
            const payload = event.data.json();
            options.body = payload.message || options.body;
            options.data = payload.data || options.data;
        } catch (error) {
            console.error('Error parsing push payload:', error);
        }
    }
    
    event.waitUntil(
        self.registration.showNotification('Kartao.cz', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Open or focus the app
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window if app is not open
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// IndexedDB helper
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('kartao-offline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('offline-messages')) {
                db.createObjectStore('offline-messages', { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains('offline-analytics')) {
                db.createObjectStore('offline-analytics', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

async function syncContent() {
    try {
        // Sync latest content in background
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        const response = await fetch('/api/content/latest');
        
        if (response.ok) {
            await cache.put('/api/content/latest', response.clone());
        }
    } catch (error) {
        console.error('Periodic sync failed:', error);
    }
}

// Message handling from main thread
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(updateCache(event.data.urls));
    }
});

async function updateCache(urls) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.error(`Failed to update cache for ${url}:`, error);
        }
    }
}