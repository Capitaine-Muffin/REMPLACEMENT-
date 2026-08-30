/**
 * Service worker minimal : l'application est mise en cache à la première
 * visite puis servie depuis le cache, pour fonctionner sans réseau.
 * Stratégie "réseau d'abord, cache en secours" pour récupérer les mises à jour.
 */
const CACHE = 'remplacement-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add('./')))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const requete = e.request
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) return

  e.respondWith(
    fetch(requete)
      .then((reponse) => {
        const copie = reponse.clone()
        caches.open(CACHE).then((c) => c.put(requete, copie))
        return reponse
      })
      .catch(() =>
        caches.match(requete).then((cachee) => cachee ?? caches.match('./')),
      ),
  )
})
