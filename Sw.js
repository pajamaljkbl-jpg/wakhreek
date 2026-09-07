
const CACHE_NAME = 'wakhreek-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'WakhReek', body: event.data ? event.data.text() : 'Appel entrant' };
  }
  
  const title = data.title || 'WakhReek - Appel entrant';
  const options = {
    body: data.body || (data.caller_name || 'Quelqu un') + ' vous appelle...',
    icon: '/wakhreek-logo.svg',
    badge: '/wakhreek-logo.svg',
    tag: 'call-' + (data.call_id || Date.now()),
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 600, 100, 300],
    data: {
      call_id: data.call_id,
      conversation_id: data.conversation_id,
      caller_name: data.caller_name,
      call_type: data.call_type || 'audio',
      url: '/communication?call_id=' + (data.call_id || '')
    },
    actions: [
      { action: 'accept', title: 'Accepter' },
      { action: 'reject', title: 'Refuser' }
    ],
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const callId = data.call_id;

  if (event.action === 'reject' && callId) {
    event.waitUntil(
      fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-call-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callId, action: 'reject' })
      }).catch(()=>{})
    );
    return;
  }

  const urlToOpen = data.url || '/communication';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/communication') && 'focus' in client) {
          client.postMessage({ type: 'INCOMING_CALL', call_id: callId, data });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
