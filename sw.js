// Service Worker — الإصدار 2
// الصفحة: الشبكة أولًا ثم النسخة المحفوظة عند انقطاع الاتصال.
// طلبات الأسعار (من مواقع خارجية) لا تُخزَّن أبدًا حتى لا تظهر بيانات قديمة أو فاشلة.
const CACHE = 'btc-board-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-32.png', './icons/icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // لا تتدخّل في طلبات الـ API

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) =>
      list.length ? list[0].focus() : self.clients.openWindow('./')
    )
  );
});
