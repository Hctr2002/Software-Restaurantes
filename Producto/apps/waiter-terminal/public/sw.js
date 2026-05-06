// Service Worker — Waiter Terminal
// Handles Web Push notifications for ORDER_READY events

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  if (!e.data) return;

  let payload = {};
  try { payload = e.data.json(); } catch { payload = { title: 'Nuevo aviso', body: e.data.text() }; }

  const { title = 'Menu Bites', body = 'Hay novedades en tu terminal', tag = 'order-ready', icon = '/icon.png' } = payload;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon,
      badge: '/icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
