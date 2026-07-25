import { safeAppNextPath } from '@/utils/safeNextPath'

const STORAGE_KEY = 'gs.auth.return-path'
const MAX_AGE_MS = 30 * 60 * 1000

type StoredIntent = {
  path: string
  createdAt: number
}

function readIntent(storage: Storage): StoredIntent | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredIntent>
    const path = safeAppNextPath(parsed.path)
    const createdAt = Number(parsed.createdAt)
    if (!path || !Number.isFinite(createdAt) || Date.now() - createdAt > MAX_AGE_MS) {
      storage.removeItem(STORAGE_KEY)
      return null
    }
    return { path, createdAt }
  } catch {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Storage may be entirely unavailable in strict privacy modes.
    }
    return null
  }
}

/** Preserve a same-origin deep link across Clerk/Google's full-page OAuth redirect. */
export function rememberAuthReturnPath(rawPath: string | null | undefined): string | null {
  const path = safeAppNextPath(rawPath)
  if (!path || path === '/') return null

  const value = JSON.stringify({ path, createdAt: Date.now() } satisfies StoredIntent)
  try {
    sessionStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Ignore unavailable session storage.
  }
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Local storage is a fallback for browsers that isolate OAuth tabs.
  }
  return path
}

export function consumeAuthReturnPath(): string | null {
  let intent: StoredIntent | null = null
  try {
    intent = readIntent(sessionStorage)
  } catch {
    // Ignore unavailable session storage.
  }
  if (!intent) {
    try {
      intent = readIntent(localStorage)
    } catch {
      // Ignore unavailable local storage.
    }
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
  return intent?.path ?? null
}
