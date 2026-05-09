// Service Worker for enhanced notifications
const CACHE_NAME = 'trendtial-crm-v1';

// Only cache the shell — Vite hashes JS/CSS so we don't list them here.
// This SW exists for push notifications, not offline caching.
const urlsToCache = ['/trlogo.png'];

// Install event — cache only guaranteed-static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(urlsToCache.map((url) => cache.add(url)))
    )
  );
  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch event — ONLY handle same-origin requests.
// Cross-origin requests (Supabase, backend API, external CDNs) must NEVER be
// intercepted by the SW — doing so breaks CORS for credentialed API calls.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Let the browser handle all cross-origin requests natively
  if (url.origin !== self.location.origin) {
    return;
  }

  // For same-origin requests: cache-first for static assets, network-first otherwise
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  const action = event.action;
  
  notification.close();
  
  // Handle different actions
  let url = '/';
  
  if (action === 'view_followup') {
    url = `/follow-ups?highlightId=${data.entity_id}`;
  } else if (action === 'view_meeting') {
    url = `/meetings?highlightId=${data.entity_id}`;
  } else if (action === 'complete_followup') {
    // Handle completion action - could send a message to the main app
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'COMPLETE_FOLLOWUP',
          entity_id: data.entity_id
        });
      });
    });
    return;
  } else if (action === 'join_meeting') {
    // Handle join meeting action
    if (data.metadata?.location) {
      url = data.metadata.location;
    } else {
      url = `/meetings?highlightId=${data.entity_id}`;
    }
  } else {
    // Default click behavior
    if (data.entity_type === 'follow_up') {
      url = `/follow-ups?highlightId=${data.entity_id}`;
    } else if (data.entity_type === 'meeting') {
      url = `/meetings?highlightId=${data.entity_id}`;
    } else {
      url = '/dashboard';
    }
  }
  
  // Open the URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      const existingClient = clientList.find(client => 
        client.url.includes(url.split('?')[0])
      );
      
      if (existingClient) {
        return existingClient.focus();
      } else {
        return clients.openWindow(url);
      }
    })
  );
  
  // Send message to main application
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NOTIFICATION_CLICK',
          notificationId: data.notificationId,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          action: action,
          metadata: data.metadata
        });
      });
    })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal if needed
  const data = event.notification.data || {};
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_DISMISSED',
        notificationId: data.notificationId,
        entity_type: data.entity_type,
        entity_id: data.entity_id
      });
    });
  });
});

// Background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // This would sync with your notification API
  console.log('Syncing notifications in background');
  
  try {
    // Example: fetch pending notifications from your API
    // const response = await fetch('/api/notifications/pending');
    // const notifications = await response.json();
    
    // Show any pending notifications
    // notifications.forEach(notification => {
    //   self.registration.showNotification(notification.title, {
    //     body: notification.message,
    //     icon: '/trlogo.png',
    //     data: notification
    //   });
    // });
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Push notification handler (for future server-sent notifications)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/trlogo.png',
    badge: '/trlogo.png',
    data: data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'crm-notification'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SHOW_NOTIFICATION':
      self.registration.showNotification(data.title, {
        body: data.message,
        icon: data.icon || '/trlogo.png',
        data: data
      });
      break;
      
    case 'SYNC_NOTIFICATIONS':
      event.waitUntil(syncNotifications());
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
}); 