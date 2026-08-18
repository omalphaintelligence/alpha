/* Alpha Intel service worker
 *
 * Deliberately conservative. It caches the app shell so the icon on
 * the home screen opens instantly and survives a flaky connection.
 * It never caches:
 *   - Supabase (auth tokens, subscription status)
 *   - Google Apps Script (screener + live prices)
 *   - Finnhub (ticker quotes)
 * Those must always hit the network, or a signed-out user could be
 * served a cached signed-in view, or you'd be shown stale prices.
 *
 * Bump CACHE_VERSION whenever you upload a new app.html.
 */

const CACHE_VERSION = 'alpha-intel-v1';

const SHELL = [
  'app.html',
  'app-manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-192.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png'
];

/* Any request whose host matches one of these bypasses the cache
   completely — straight to the network, every time. */
const NEVER_CACHE = [
  'supabase.co',
  'supabase.in',
  'script.google.com',
  'script.googleusercontent.com',
  'finnhub.io',
  'ipapi.co'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[sw] precache failed', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  if (NEVER_CACHE.some(host => url.hostname.endsWith(host))) return;

  /* HTML: network first, so a freshly uploaded app.html lands on the
     next launch. Cache is only the offline fallback. */
  const isHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || caches.match('app.html')))
    );
    return;
  }

  /* Static assets (icons, fonts, the Supabase JS bundle):
     cache first, refresh in the background. */
  event.respondWith(
    caches.match(req).then(hit => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || network;
    })
  );
});

/* Lets the page trigger an immediate update without a second launch. */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
