/**
 * Òrbita Events - Service Worker
 *
 * Funcionalidades:
 * - Cache-first para assets estáticos
 * - Network-first para páginas HTML
 * - Offline fallback
 * - Background sync para formularios
 */

const CACHE_NAME = 'orbita-v1';
const OFFLINE_PAGE = '/offline.html';

// Assets para cachear inmediatamente
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/img/logoplanetatextdreta.svg',
  '/img/logosoloplaneta.svg',
];

// Patrones para cachear dinámicamente
const CACHE_PATTERNS = {
  images: /\.(png|jpg|jpeg|webp|gif|svg|ico)$/i,
  fonts: /\.(woff|woff2|ttf|otf|eot)$/i,
  styles: /\.css$/i,
  scripts: /\.js$/i,
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL - Cachear assets iniciales
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  // Activar inmediatamente
  self.skipWaiting();
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE - Limpiar caches antiguos
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Tomar control inmediatamente
  self.clients.claim();
});

// ═══════════════════════════════════════════════════════════════════════════
// FETCH - Estrategias de cache
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no son HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar requests a APIs externas
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Ignorar requests de Next.js dev/HMR
  if (url.pathname.includes('_next/webpack') || url.pathname.includes('__nextjs')) {
    return;
  }

  // POST requests - Network only
  if (request.method !== 'GET') {
    event.respondWith(networkOnly(request));
    return;
  }

  // Páginas HTML - Network first, fallback to cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Imágenes - Cache first
  if (CACHE_PATTERNS.images.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Fonts - Cache first (largo plazo)
  if (CACHE_PATTERNS.fonts.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // CSS/JS - Stale while revalidate
  if (CACHE_PATTERNS.styles.test(url.pathname) || CACHE_PATTERNS.scripts.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirst(request));
});

// ═══════════════════════════════════════════════════════════════════════════
// ESTRATEGIAS DE CACHE
// ═══════════════════════════════════════════════════════════════════════════

// Network only - No cachear
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('[SW] Network only failed:', error);
    throw error;
  }
}

// Cache first - Buscar en cache primero, luego red
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

// Network first - Intentar red, fallback a cache
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es navegación y no hay cache, mostrar página offline
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match(OFFLINE_PAGE);
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// Stale while revalidate - Devolver cache y actualizar en background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKGROUND SYNC - Para formularios offline
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  try {
    const db = await openDB();
    const forms = await getStoredForms(db);

    for (const form of forms) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form.data),
        });

        if (response.ok) {
          await deleteStoredForm(db, form.id);
          console.log('[SW] Form synced successfully');
        }
      } catch (error) {
        console.error('[SW] Form sync failed:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('orbita-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('forms')) {
        db.createObjectStore('forms', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getStoredForms(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('forms', 'readonly');
    const store = transaction.objectStore('forms');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteStoredForm(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('forms', 'readwrite');
    const store = transaction.objectStore('forms');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (preparado para futuro uso)
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'Òrbita Events', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: data.tag || 'default',
      data: data.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service Worker loaded - Òrbita Events');
