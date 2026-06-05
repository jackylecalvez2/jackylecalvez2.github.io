/* Service worker Notes de frais — stratégie NETWORK-FIRST sur la navigation.
   But : l'appli installée (écran d'accueil iPhone) récupère TOUJOURS la dernière
   version à l'ouverture, sans réinstallation. Le cache ne sert QUE de repli hors-ligne.
   Ne touche jamais aux données (IndexedDB/localStorage/Supabase) — uniquement le shell HTML. */
const SHELL = 'ndf-shell';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  // On n'intercepte QUE la navigation same-origin (le HTML de l'appli). Le reste (CDN, etc.)
  // passe directement au navigateur.
  if (isNav && url.origin === self.location.origin) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });   // toujours la dernière version
        const cache = await caches.open(SHELL);
        cache.put('./', fresh.clone());                          // copie pour le hors-ligne
        return fresh;
      } catch (_) {
        const cache = await caches.open(SHELL);                  // hors-ligne : on sert le shell mis en cache
        return (await cache.match('./')) || (await cache.match(req)) || Response.error();
      }
    })());
  }
});
