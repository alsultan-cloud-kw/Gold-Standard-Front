import { apiService } from '@/services/api'
import { getFirebaseMessaging, isFirebaseWebConfigured } from '@/lib/firebase'
import { deleteToken, getToken, onMessage } from 'firebase/messaging'

const SW_PATH = '/firebase-messaging-sw.js'
const PREF_KEY = 'gs_web_push_enabled'
const DEVICE_UUID_KEY = 'gs_web_push_device_uuid'
const TOKEN_KEY = 'gs_web_fcm_token'

let foregroundListenerAttached = false
/** Cached Django VAPID public key — never from VITE_* / Vercel. */
let cachedVapidKey: string | null | undefined

function localeForPush(): string {
  const lang =
    localStorage.getItem('app_lang') || document.documentElement.getAttribute('lang') || 'en'
  return lang.startsWith('ar') ? 'ar' : 'en'
}

function getOrCreateDeviceUuid(): string {
  try {
    const existing = localStorage.getItem(DEVICE_UUID_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(DEVICE_UUID_KEY, id)
    return id
  } catch {
    return `web-${Date.now()}`
  }
}

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getWebPushPreference(): Promise<boolean> {
  try {
    return localStorage.getItem(PREF_KEY) !== '0'
  } catch {
    return true
  }
}

export async function setWebPushPreference(enabled: boolean): Promise<void> {
  localStorage.setItem(PREF_KEY, enabled ? '1' : '0')
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null
  try {
    return await navigator.serviceWorker.register(SW_PATH)
  } catch {
    return null
  }
}

type VapidResponse = {
  public_key?: string | null
  vapid?: { ready?: boolean; mode?: string }
}

/**
 * Load Web Push VAPID public key from Django only (do not bake into Vite/Vercel).
 * Server env: VAPID_PUBLIC_KEY or FIREBASE_VAPID_KEY.
 */
export async function fetchVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey !== undefined) return cachedVapidKey
  try {
    const data = await apiService.get<VapidResponse>('/accounts/push/web/vapid-public-key/')
    const key = (data?.public_key || '').trim()
    cachedVapidKey = key || null
    return cachedVapidKey
  } catch {
    cachedVapidKey = null
    return null
  }
}

async function registerTokenWithBackend(token: string): Promise<void> {
  const deviceUuid = getOrCreateDeviceUuid()
  await apiService.post('/notifications/devices/', {
    device_uuid: deviceUuid,
    platform: 'web',
    device_type: 'web',
    fcm_token: token,
    push_provider: 'fcm',
    locale: localeForPush(),
    notification_permission: { status: 'granted' },
    os_name: navigator.platform || 'web',
    model: 'browser',
    user_agent: navigator.userAgent.slice(0, 255),
  })
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

async function unregisterTokenWithBackend(token: string | null): Promise<void> {
  const deviceUuid = getOrCreateDeviceUuid()
  try {
    await apiService.delete('/notifications/devices/', {
      data: {
        device_uuid: deviceUuid,
        fcm_token: token || undefined,
      },
    })
  } catch {
    /* ignore */
  }
}

export async function subscribeWebPush(): Promise<string | null> {
  if (!isWebPushSupported()) return null
  if (!isFirebaseWebConfigured()) {
    // Missing Firebase web app config (create Web app in Firebase Console).
    return null
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (permission !== 'granted') return null

  const reg = await ensureServiceWorker()
  if (!reg) return null

  const messaging = await getFirebaseMessaging()
  if (!messaging) return null

  const vapidKey = await fetchVapidPublicKey()
  if (!vapidKey) return null

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: reg,
  })
  if (!token) return null

  await registerTokenWithBackend(token)
  await setWebPushPreference(true)

  // Foreground messages while the tab is open (once per page lifetime)
  if (!foregroundListenerAttached) {
    foregroundListenerAttached = true
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Gold Standard'
      const body = payload.notification?.body || payload.data?.body || ''
      const url = payload.data?.url || payload.data?.deep_link || '/'
      if (Notification.permission === 'granted') {
        const n = new Notification(title, {
          body,
          icon: '/favicons/android-chrome-192x192.png',
          data: { url },
        })
        n.onclick = () => {
          window.focus()
          if (url.startsWith('http') || url.startsWith('/')) {
            window.location.assign(url)
          }
          n.close()
        }
      }
    })
  }

  return token
}

export async function unsubscribeWebPush(): Promise<void> {
  await setWebPushPreference(false)
  let token: string | null = null
  try {
    token = localStorage.getItem(TOKEN_KEY)
  } catch {
    token = null
  }

  await unregisterTokenWithBackend(token)

  try {
    const messaging = await getFirebaseMessaging()
    if (messaging) await deleteToken(messaging)
  } catch {
    /* ignore */
  }

  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export async function setWebPushEnabled(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const token = await subscribeWebPush()
    return Boolean(token)
  }
  await unsubscribeWebPush()
  return true
}

/** Soft-fail bootstrap: register SW and re-sync FCM token if preference is on. */
export async function syncWebPushOnLaunch(): Promise<void> {
  if (!isWebPushSupported()) return
  await ensureServiceWorker()
  const enabled = await getWebPushPreference()
  if (!enabled) return
  if (Notification.permission !== 'granted') return
  await subscribeWebPush()
}
