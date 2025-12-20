/**
 * Service Worker for Push Notifications
 */

const CACHE_NAME = 'nuttyfans-v1';
const urlsToCache = ['/', '/explore', '/messages', '/notifications'];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Push event - handle push notifications
/* eslint-disable */
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'NuttyFans', body: event.data.text() };
    }
  }

  const options = {
    title: data.title || 'NuttyFans',
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    tag: data.tag || 'notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(options.title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const actionUrl = event.notification.data?.actionUrl || '/';

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If a window is already open, focus it
        for (const client of clientList) {
          if (client.url === actionUrl && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(actionUrl);
        }
      })
    );
  }
});
