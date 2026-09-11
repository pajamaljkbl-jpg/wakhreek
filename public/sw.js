const CACHE_NAME = 'wakhreek-v5-incoming-call-screen';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(clients.claim()); });

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

    // Best effort only: mobile operating systems may refuse automatic foregrounding.
    // If WakhReek is already open, wake/navigate that client so the in-app
    // Accept / Reject screen can be displayed by Communication.
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
          if ('navigate' in client) await client.navigate(incomingUrl);
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

  // Do not try to accept/reject WebRTC inside the service worker. Media permission
  // and WebRTC must stay in the foreground app. A tap always opens/focuses the
  // Communication screen where the user gets the real Accept / Reject controls.
  event.waitUntil((async () => {
    const list = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of list) {
      if (client.url.includes('/communication')) {
        try {
          if ('navigate' in client) await client.navigate(url);
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
