/* RUHA offline shell + notification interaction. Push delivery needs a configured backend. */
const CACHE_NAME = 'ruha-shell-v1';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './static/ruha/styles.css',
  './static/ruha/app.js', './static/ruha/icons/icon-192.svg', './static/ruha/icons/icon-512.svg', './static/ruha/icons/icon-192.png', './static/ruha/icons/icon-512.png', './static/ruha/icons/icon-maskable-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => undefined));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ruha-shell-') && k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Never cache private API, admin, or attachment responses in the offline shell.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/private-media/')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return response;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => {
    const fresh = fetch(event.request).then(response => {
      if (response && response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'یادآور RUHA';
  const options = {
    body: data.body || 'زمان انجام یکی از کارها رسیده است.',
    icon: './static/ruha/icons/icon-192.svg',
    badge: './static/ruha/icons/icon-192.svg',
    tag: data.tag || (data.itemId ? `ruha-${data.itemId}` : 'ruha-push'),
    renotify: false,
    data: { itemId: data.itemId || data.id || null, url: data.url || './index.html' },
    actions: [ { action: 'done', title: 'انجام شد' }, { action: 'snooze', title: '۱۰ دقیقه بعد' } ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const id = event.notification.data && event.notification.data.itemId;
  const action = event.action;
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    let client = clientsList.find(c => 'focus' in c);
    if (client) {
      await client.focus();
      if (id && action === 'done') client.postMessage({ type: 'RUHA_COMPLETE', id });
      else if (id && action === 'snooze') client.postMessage({ type: 'RUHA_SNOOZE', id });
      else if (id) client.postMessage({ type: 'RUHA_OPEN', id });
      return;
    }
    if (action === 'done' || action === 'snooze') return;
    const url = event.notification.data && event.notification.data.url || './index.html';
    await self.clients.openWindow(url);
  })());
});
self.addEventListener('notificationclose', event => {
  // Reserved for optional engagement metrics; RUHA does not send analytics.
});
