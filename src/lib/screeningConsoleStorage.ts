/** Session/local history for /gs-kyc console tool tabs */

const HISTORY_KEY = 'gs.kyc.screening.history.v1'
const WATCHLIST_KEY = 'gs.kyc.screening.watchlist.v1'
const ACTIVE_TAB_KEY = 'gs.kyc.screening.activeTab.v1'

export type ScreeningConsoleTab =
  | 'overview'
  | 'screening'
  | 'history'
  | 'watchlist'
  | 'reporting'

export type LocalScreenRecord = {
  referenceId: string
  query: string
  matched: boolean
  matchType: string | null
  similarityScore: number | null
  matchedNames: string[]
  at: string
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

export function loadActiveTab(): ScreeningConsoleTab {
  const raw = sessionStorage.getItem(ACTIVE_TAB_KEY) || localStorage.getItem(ACTIVE_TAB_KEY)
  if (
    raw === 'overview' ||
    raw === 'screening' ||
    raw === 'history' ||
    raw === 'watchlist' ||
    raw === 'reporting'
  ) {
    return raw
  }
  return 'screening'
}

export function saveActiveTab(tab: ScreeningConsoleTab): void {
  try {
    sessionStorage.setItem(ACTIVE_TAB_KEY, tab)
    localStorage.setItem(ACTIVE_TAB_KEY, tab)
  } catch {
    /* private mode */
  }
}

export function loadScreenHistory(): LocalScreenRecord[] {
  const rows = readJson<LocalScreenRecord[]>(HISTORY_KEY)
  return Array.isArray(rows) ? rows.slice(0, 40) : []
}

export function pushScreenHistory(row: LocalScreenRecord): LocalScreenRecord[] {
  const next = [row, ...loadScreenHistory().filter((r) => r.referenceId !== row.referenceId)].slice(
    0,
    40,
  )
  writeLocal(HISTORY_KEY, next)
  return next
}

export function loadWatchlist(): string[] {
  const rows = readJson<string[]>(WATCHLIST_KEY)
  if (!Array.isArray(rows)) return []
  return [...new Set(rows.map((n) => n.trim()).filter(Boolean))].slice(0, 30)
}

export function toggleWatchlistName(name: string): string[] {
  const clean = name.trim()
  if (!clean) return loadWatchlist()
  const cur = loadWatchlist()
  const next = cur.includes(clean)
    ? cur.filter((n) => n !== clean)
    : [clean, ...cur].slice(0, 30)
  writeLocal(WATCHLIST_KEY, next)
  return next
}
