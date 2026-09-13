const CACHE_NAME = 'wakhreek-v7-pwa-offline';
const OFFLINE_ASSETS = [
  '/',
  '/communication',
  '/manifest.json',
  '/wakhreek-logo.svg',
  '/wakhreek-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(OFFLINE_ASSETS.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await clients.claim();
  })());
});

// Offline support for public WakhReek pages and static assets only.
// API/auth/realtime requests are deliberately never cached.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) ||
          (url.pathname.startsWith('/communication') ? await caches.match('/communication') : null) ||
          (await caches.match('/'));
      }
    })());
    return;
  }

  const isStatic = ['style', 'script', 'image', 'font'].includes(request.destination) ||
    url.pathname === '/manifest.json';

  if (isStatic) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) {
        event.waitUntil(fetch(request).then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
        }).catch(() => {}));
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return caches.match(request);
      }
    })());
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) {
    try { data = JSON.parse(event.data.text()); }
    catch { data = { title: 'WakhReek', body: 'Appel entrant', call_id: '' }; }
  }

  const title = data.title || 'WakhReek';
  const body = data.body || (data.caller_name ? data.caller_name + ' vous appelle...' : 'Appel entrant WakhReek');
  const callId = data.call_id || '';
  const incomingUrl = '/communication?call_id=' + encodeURIComponent(callId) + '&incoming=1';

  const options = {
    body,
    icon: '/wakhreek-logo.svg',
    badge: '/wakhreek-logo.svg',
    tag: 'call-' + callId,
    renotify: true,
    requireInteraction: true,
    vibrate: [500,200,500,200,1000,300,500],
    silent: false,
    data: { call_id: callId, url: incomingUrl }
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);

    // Wake an already-open WakhReek client without navigating/reloading it.
    // The foreground Communication page owns the real Accept / Reject UI.
    // Navigating here can race with that UI and make the same call appear twice.
    try {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        try {
          client.postMessage({
            type: 'INCOMING_CALL_WAKE',
            call_id: callId,
            caller_name: data.caller_name,
            call_type: data.call_type
          });
        } catch (_) {}
      }
    } catch (_) {}
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const callId = data.call_id || '';
  const url = data.url || ('/communication?call_id=' + encodeURIComponent(callId) + '&incoming=1');

  // WebRTC acceptance/rejection stays in the foreground app. A notification tap
  // only focuses or opens Communication, where the user gets one Accept / Reject screen.
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if (client.url.includes('/communication')) {
        try {
          client.postMessage({ type: 'INCOMING_CALL_WAKE', call_id: callId });
          if ('focus' in client) await client.focus();
          return;
        } catch (_) {}
      }
    }
    await clients.openWindow(url);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
