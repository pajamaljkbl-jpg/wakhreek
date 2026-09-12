const CACHE_NAME = 'wakhreek-v6-single-incoming-call-screen';

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
