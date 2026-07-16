/** Live ticker + session memory for /gs-kyc screening console */

const SESSION_KEY = 'gs.kyc.screening.session.v1'

export type ScreeningSessionState = {
  lastQuery: string
  lastReferenceId: string | null
  screensToday: number
  dayKey: string
}

export type TickerItem = {
  id: string
  kind: 'indexed' | 'synced' | 'screened' | 'cleared' | 'flagged'
  name: string
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
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

/**
 * Marquee from a small random sample of real registry names only.
 * Do not inject the full index count into the scroll — that belongs in metrics.
 */
export function buildTickerReel(sampleNames: string[]): TickerItem[] {
  const kinds: TickerItem['kind'][] = ['indexed', 'synced', 'screened', 'cleared', 'flagged']
  const unique = [...new Set(sampleNames.map((n) => n.trim()).filter(Boolean))]

  return unique.map((name, i) => ({
    id: `reg-${i}-${name.slice(0, 12)}`,
    kind: kinds[i % kinds.length],
    name,
  }))
}
