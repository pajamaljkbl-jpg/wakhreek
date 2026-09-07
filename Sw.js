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

  event.waitUntil(
    (async () => {
      // 1. Show notification (this wakes screen briefly)
      await self.registration.showNotification(title, options);
      
      // 2. Try to wake screen like WhatsApp - auto open call page
      try {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        
        if (allClients.length > 0) {
          // App already open in background - focus it and tell it to ring
          for (const client of allClients) {
            try {
              if ('focus' in client) await client.focus();
              client.postMessage({ type: 'INCOMING_CALL_WAKE', call_id: callId, caller_name: data.caller_name, call_type: data.call_type });
            } catch(e){}
          }
          // Also try to navigate focused client to call page
          if (allClients[0] && 'navigate' in allClients[0]) {
            try { await allClients[0].navigate(incomingUrl); } catch(e){}
          }
        } else {
          // App closed - try to open it automatically like WhatsApp does
          // This works on Android if PWA is installed and user interacted recently
          await clients.openWindow(incomingUrl);
        }
      } catch (err) {
        console.log('Auto-wake failed, fallback to notification only', err);
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  const url = data.url || '/communication';
  
  if (action === 'reject') {
    // Tell server call was rejected
    event.waitUntil(
      fetch('/api/call-reject?call_id=' + data.call_id, { method: 'POST' }).catch(()=>{})
    );
    return;
  }

  // Accept or click on body - open/focus call page (wakes screen)
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
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
