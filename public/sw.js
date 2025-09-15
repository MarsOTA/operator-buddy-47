// Service Worker for Push Notifications
const CACHE_NAME = 'ezystaff-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event
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

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const defaultOptions = {
    body: 'Nuova notifica disponibile',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: '/operator'
    },
    actions: [
      {
        action: 'view',
        title: 'Visualizza',
        icon: '/pwa-192x192.png'
      }
    ],
    requireInteraction: true,
    tag: 'ezystaff-notification'
  };

  let notificationOptions = defaultOptions;

  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Push data received:', pushData);
      
      // Update app badge
      if ('setAppBadge' in self && pushData.badgeCount) {
        self.setAppBadge(pushData.badgeCount);
      }
      
      notificationOptions = {
        ...defaultOptions,
        title: pushData.title || 'EZYSTAFF',
        body: pushData.body || defaultOptions.body,
        data: {
          ...defaultOptions.data,
          eventId: pushData.eventId,
          shiftId: pushData.shiftId,
          type: pushData.type,
          url: pushData.shiftId ? `/operator/shift/${pushData.shiftId}` : '/operator'
        }
      };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationOptions.title || 'EZYSTAFF',
      notificationOptions
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/operator';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Try to focus existing window
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            client.focus();
            // Try to navigate if client supports it
            if ('navigate' in client) {
              client.navigate(self.location.origin + urlToOpen);
            } else {
              // Fallback: post message to client for navigation
              client.postMessage({ 
                action: 'navigate', 
                url: urlToOpen,
                notificationData: event.notification.data 
              });
            }
            return;
          }
        }
        
        // If no existing window, open new one
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin + urlToOpen);
        }
      })
    );
  }
});

// Message event for communication with main thread (badge updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    if ('setAppBadge' in self) {
      const count = event.data.count || 0;
      if (count > 0) {
        self.setAppBadge(count);
      } else {
        self.clearAppBadge();
      }
    }
  }
});