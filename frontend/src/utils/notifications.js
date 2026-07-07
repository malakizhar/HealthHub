const API = import.meta.env.VITE_API_URL || '/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    return reg;
  } catch (e) {
    console.warn('SW registration failed', e);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function subscribeWebPush() {
  const reg = await registerServiceWorker();
  if (!reg || !('PushManager' in window)) return null;

  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return null;

  const res = await fetch(`${API}/notifications/vapid-public-key`);
  if (!res.ok) return null;
  const { publicKey } = await res.json();

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = sub.toJSON();
  await fetch(`${API}/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': localStorage.getItem('healthhub_user_id') || '' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  });

  return sub;
}

export function showLocalNotification(title, body) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/favicon.svg',
    tag: 'healthhub-local',
    vibrate: [200, 100, 200],
  });
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

export function syncMedsToServiceWorker(medications) {
  navigator.serviceWorker?.ready.then((reg) => {
    reg.active?.postMessage({ type: 'SYNC_MEDS', medications });
  });
}

/** In-browser alarm when tab is open (works without HTTPS on laptop) */
export function startLocalReminderWatcher(medications, onFire) {
  const fired = new Set();

  const check = () => {
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateKey = now.toISOString().slice(0, 10);

    for (const m of medications) {
      if (m.taken) continue;
      const times = [m.time?.slice(0, 5)];
      if ((m.frequency || '').toLowerCase().includes('twice') && times[0]) {
        const [h, mi] = times[0].split(':').map(Number);
        times.push(`${String((h + 12) % 24).padStart(2, '0')}:${String(mi).padStart(2, '0')}`);
      }
      for (const t of times) {
        const key = `${m.id}-${dateKey}-${t}`;
        if (t === hm && !fired.has(key)) {
          fired.add(key);
          const title = 'Medicine reminder';
          const body = `Take ${m.name} ${m.dose || ''}`.trim();
          showLocalNotification(title, body);
          onFire?.(m);
        }
      }
    }
  };

  check();
  const id = setInterval(check, 15000);
  return () => clearInterval(id);
}

export function googleCalendarUrl(med) {
  const [h, mi] = (med.time || '08:00').split(':').map(Number);
  const start = new Date();
  start.setHours(h, mi, 0, 0);
  if (start < new Date()) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 15 * 60000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Take ${med.name} ${med.dose || ''}`.trim(),
    details: `HealthHub reminder — ${med.frequency || 'daily'}`,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
