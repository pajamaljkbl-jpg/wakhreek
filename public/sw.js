const CACHE_NAME = 'wakhreek-v9-offline-shell';

// Only cache a public offline fallback and its logo. Never cache authenticated pages,
// private messages, API responses, or Next.js application assets.
const OFFLINE_ASSETS = ['/offline.html', '/wakhreek-192-v2.png'];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(OFFLINE_ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith('wakhreek-'))
        .map((key) => caches.delete(key))
    );
    await clients.claim();
  })());
});

// Network-first navigation: offline fallback only when the network is unavailable.
// Do not cache pages that may contain user-specific information.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try { return await fetch(event.request); }
    catch (_) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/offline.html')) || Response.error();
    }
  })());
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
