import { initializeApp, type FirebaseApp, getApps } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

/**
 * Public Firebase web config (goldstandard-dcca4).
 * Safe to expose — not the Admin SDK service account.
 * Env vars override these defaults when set.
 */
export const firebaseWebConfig = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY || '').trim() ||
    'AIzaSyDXmSVhx9pMdSFy6JxG5wM_UI1e4J3AxNw',
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim() ||
    'goldstandard-dcca4.firebaseapp.com',
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim() || 'goldstandard-dcca4',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim() ||
    'goldstandard-dcca4.firebasestorage.app',
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim() || '277505358501',
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID || '').trim() ||
    '1:277505358501:web:96b54751f8a302e69dab4c',
  measurementId:
    (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '').trim() || 'G-39JGSRJVFJ',
}

export const firebaseVapidKey = (
  import.meta.env.VITE_FIREBASE_VAPID_KEY ||
  'BAGbC2Otp2ju5tW7xAUgHKpSX7g_vim9DyvewItHGGNabUHwgQUckFE3djbpqSJ9YvgOEBMVSedg8VNY8XOheRw'
).trim()

export function isFirebaseWebConfigured(): boolean {
  return Boolean(
    firebaseWebConfig.apiKey &&
      firebaseWebConfig.projectId &&
      firebaseWebConfig.messagingSenderId &&
      firebaseWebConfig.appId &&
      firebaseVapidKey,
  )
}

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseWebConfigured()) return null
  if (app) return app
  // messaging only — Analytics is optional and not required for FCM
  const { measurementId: _m, ...config } = firebaseWebConfig
  void _m
  app = getApps().length ? getApps()[0]! : initializeApp(config)
  return app
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null
  if (!(await isSupported())) return null
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!messaging) {
    messaging = getMessaging(firebaseApp)
  }
  return messaging
}
