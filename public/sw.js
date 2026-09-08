const CACHE_NAME = 'wakhreek-v3-whatsapp';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (e) {
    try { data = JSON.parse(event.data.text()); }
    catch { data = { title: 'WakhReek', body: 'Appel entrant', call_id: Date.now() }; }
  }

  const title = data.title || 'WakhReek';
  const body = data.body || (data.caller_name ? data.caller_name + ' vous appelle...' : 'Appel entrant WakhReek');
  const callId = data.call_id || '';
  const incomingUrl = '/communication?call_id=' + callId + '&incoming=1&autowake=1';

  const options = {
    body: body,
    icon: '/wakhreek-logo.svg',
    badge: '/wakhreek-logo.svg',
    tag: 'call-' + callId,
    renotify: true,
    requireInteraction: true,
    vibrate: [500,200,500,200,1000,300,500],
    silent: false,
    data: { call_id: callId, url: incomingUrl },
    actions: [
      { action: 'accept', title: '✅ Accepter' },
      { action: 'reject', title: '❌ Refuser' }
    ]
  };

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (allClients.length > 0) {
        for (const client of allClients) {
          try {
            if ('focus' in client) await client.focus();
            client.postMessage({ type: 'INCOMING_CALL_WAKE', call_id: callId, caller_name: data.caller_name, call_type: data.call_type });
          } catch(e){}
        }
        if (allClients[0] && 'navigate' in allClients[0]) {
          try { await allClients[0].navigate(incomingUrl); } catch(e){}
        }
      } else {
        await clients.openWindow(incomingUrl);
      }
    } catch (err) {
      console.log('Auto-wake failed, fallback to notification only', err);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/communication';

  if (action === 'reject') {
    event.waitUntil(fetch('/api/call-reject?call_id=' + data.call_id, { method: 'POST' }).catch(()=>{}));
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('/communication')) {
          client.postMessage({ type: 'ACCEPT_CALL', call_id: data.call_id });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
