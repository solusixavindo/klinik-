const CACHE_NAME = 'xaviklinika-v2'
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request))
    return
  }

  // Network first untuk API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ success: false, error: 'Tidak ada koneksi internet' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Cache first untuk static assets
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
