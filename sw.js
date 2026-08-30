/* Alpha Intel — service worker
 *
 * app.html is fetched from the network first. It used to be cached
 * like everything else, which meant a member could keep running a
 * build from days ago: access rules, plan gating and bug fixes all
 * frozen at whatever was cached. The cache is now only a fallback
 * for when the network is genuinely unavailable.
 */

var CACHE_VERSION = 'alpha-intel-v3';

var SHELL = [
  './app-manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE_VERSION) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Never touch live data or auth — those must always hit the network
     and must never sit in a cache. */
  if (url.origin !== self.location.origin) return;
  if (url.hostname.indexOf('supabase') !== -1) return;
  if (url.hostname.indexOf('script.google.com') !== -1) return;

  var isDocument = req.mode === 'navigate' ||
                   url.pathname.endsWith('/') ||
                   url.pathname.endsWith('.html');

  if (isDocument) {
    /* Network first: the newest build wins, cache is the fallback. */
    e.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match('./app.html');
          });
        })
    );
    return;
  }

  /* Icons and the manifest can come from the cache. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        return res;
      });
    })
  );
});
