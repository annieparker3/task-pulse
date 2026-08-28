self.addEventListener('install', () => {
  // @ts-expect-error ServiceWorker self skipWaiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // @ts-expect-error ServiceWorker clients claim
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push Notifications from server
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "TIME'S UP!", body: event.data.text() };
    }
  }

  const title = data.title || "TIME'S UP!";
  const options = {
    body: data.body || 'Your task has reached its time limit.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `task-${data.taskId || 'expired'}`,
    data: { taskId: data.taskId },
    actions: [
      { action: 'mark_complete', title: 'Mark Complete' },
      { action: 'add_15m', title: 'Add 15 Minutes' },
    ],
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Clicks & Action Buttons
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const taskId = event.notification.data?.taskId;

  if (action && taskId) {
    // Send action request to backend server
    event.waitUntil(
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskId }),
      }).catch((err) => console.warn('Action POST failed:', err))
    );
  }

  // Focus existing client window or open new window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
