/** Live ticker + session memory for /gs-kyc screening console */

const SESSION_KEY = 'gs.kyc.screening.session.v1'
const TICKER_CACHE_KEY = 'gs.kyc.screening.tickerCache.v1'

export type ScreeningSessionState = {
  lastQuery: string
  lastReferenceId: string | null
  screensToday: number
  dayKey: string
}

export type TickerCache = {
  sampleNames: string[]
  totalIndexed: number | null
  savedAt: number
}

export type TickerItem = {
  id: string
  name: string
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode */
  }
}

function writeSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode */
  }
}

export function loadScreeningSession(): ScreeningSessionState {
  const fallback: ScreeningSessionState = {
    lastQuery: '',
    lastReferenceId: null,
    screensToday: 0,
    dayKey: todayKey(),
  }
  const saved = readJson<ScreeningSessionState>(SESSION_KEY)
  if (!saved) return fallback
  if (saved.dayKey !== todayKey()) {
    return { ...fallback, lastQuery: saved.lastQuery, lastReferenceId: saved.lastReferenceId }
  }
  return { ...fallback, ...saved }
}

export function saveScreeningSession(patch: Partial<ScreeningSessionState>): ScreeningSessionState {
  const next = { ...loadScreeningSession(), ...patch, dayKey: todayKey() }
  writeSession(SESSION_KEY, next)
  return next
}

export function bumpScreensToday(): number {
  const cur = loadScreeningSession()
  const screensToday = (cur.dayKey === todayKey() ? cur.screensToday : 0) + 1
  saveScreeningSession({ screensToday })
  return screensToday
}

/** Instant first paint — last good sample from this browser */
export function loadTickerCache(): TickerCache {
  const saved = readJson<TickerCache>(TICKER_CACHE_KEY)
  if (!saved || !Array.isArray(saved.sampleNames)) {
    return { sampleNames: [], totalIndexed: null, savedAt: 0 }
  }
  return {
    sampleNames: saved.sampleNames.filter((n) => typeof n === 'string' && n.trim()).slice(0, 40),
    totalIndexed: typeof saved.totalIndexed === 'number' ? saved.totalIndexed : null,
    savedAt: typeof saved.savedAt === 'number' ? saved.savedAt : 0,
  }
}

export function saveTickerCache(sampleNames: string[], totalIndexed: number | null): void {
  const names = [...new Set(sampleNames.map((n) => n.trim()).filter(Boolean))].slice(0, 40)
  if (names.length === 0 && totalIndexed == null) return
  writeLocal(TICKER_CACHE_KEY, {
    sampleNames: names,
    totalIndexed,
    savedAt: Date.now(),
  } satisfies TickerCache)
}

/**
 * Marquee from a small random sample of real registry names.
 * No fake status tags (screened/cleared/synced…) — those look staged.
 */
export function buildTickerReel(sampleNames: string[]): TickerItem[] {
  const unique = [...new Set(sampleNames.map((n) => n.trim()).filter(Boolean))]
  return unique.map((name, i) => ({
    id: `reg-${i}-${name.slice(0, 12)}`,
    name,
  }))
}
