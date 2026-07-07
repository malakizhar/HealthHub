/* HealthHub AI — service worker for Web Push medicine reminders */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = { title: 'Medicine reminder', body: 'Time to take your medicine', url: '/app/medications' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'healthhub-med-reminder',
      renotify: true,
      data: { url: data.url || '/app/medications' },
      actions: [
        { action: 'open', title: 'Open app' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/app/medications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/app') && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

/* Local check every minute when SW is alive (backup for open PWA) */
let cachedMeds = [];

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_MEDS') {
    cachedMeds = event.data.medications || [];
    scheduleLocalCheck();
  }
});

function scheduleLocalCheck() {
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  for (const m of cachedMeds) {
    if (m.taken) continue;
    const times = [m.time?.slice(0, 5)];
    if ((m.frequency || '').toLowerCase().includes('twice') && times[0]) {
      const [h, mi] = times[0].split(':').map(Number);
      times.push(`${String((h + 12) % 24).padStart(2, '0')}:${String(mi).padStart(2, '0')}`);
    }
    if (times.includes(hm)) {
      self.registration.showNotification('Medicine reminder', {
        body: `Take ${m.name} ${m.dose || ''}`.trim(),
        icon: '/favicon.svg',
        vibrate: [200, 100, 200],
        tag: `med-${m.id}-${hm}`,
      });
    }
  }
}

setInterval(scheduleLocalCheck, 60000);
