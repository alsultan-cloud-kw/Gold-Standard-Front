/* Gold Standard — Web Push service worker (simple) */
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Gold Standard',
    body: '',
    icon: '/favicons/android-chrome-192x192.png',
    badge: '/favicons/favicon-32x32.png',
    image: undefined,
    url: '/',
    data: {},
  }

  try {
    if (event.data) {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    }
  } catch {
    try {
      const text = event.data && event.data.text()
      if (text) payload.body = text
    } catch {
      /* ignore */
    }
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicons/android-chrome-192x192.png',
    badge: payload.badge || '/favicons/favicon-32x32.png',
    data: {
      url: payload.url || '/',
      ...(payload.data || {}),
    },
    requireInteraction: false,
  }

  if (payload.image) {
    options.image = payload.image
  }

  event.waitUntil(self.registration.showNotification(payload.title || 'Gold Standard', options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  const absolute = target.startsWith('http')
    ? target
    : new URL(target, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(absolute)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(absolute)
      }
      return undefined
    }),
  )
})
