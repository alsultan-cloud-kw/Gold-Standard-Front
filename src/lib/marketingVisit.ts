import api from '@/services/api'

const SESSION_KEY = 'gs_marketing_visit_v1'

type VisitPayload = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  referrer?: string
  referrer_host?: string
  landing_path?: string
  user_agent?: string
}

function readUtmParams(): VisitPayload {
  const params = new URLSearchParams(window.location.search)
  const payload: VisitPayload = {
    landing_path: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    user_agent: navigator.userAgent.slice(0, 300),
  }
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const) {
    const v = params.get(key)?.trim()
    if (v) payload[key] = v.slice(0, 120)
  }
  const ref = document.referrer?.trim()
  if (ref) {
    payload.referrer = ref.slice(0, 300)
    try {
      payload.referrer_host = new URL(ref).hostname.replace(/^www\./, '').toLowerCase()
    } catch {
      /* ignore */
    }
  }
  return payload
}

function shouldTrack(payload: VisitPayload): boolean {
  const hasUtm = Boolean(
    payload.utm_source || payload.utm_medium || payload.utm_campaign || payload.utm_content || payload.utm_term
  )
  const hasReferrer = Boolean(payload.referrer_host)
  return hasUtm || hasReferrer
}

function sessionFingerprint(payload: VisitPayload): string {
  return [
    payload.utm_source || '',
    payload.utm_medium || '',
    payload.utm_campaign || '',
    payload.landing_path || '',
    payload.referrer_host || '',
  ].join('|')
}

/** Fire once per browser session when UTM tags or external referrer are present. */
export async function trackMarketingVisit(): Promise<void> {
  if (typeof window === 'undefined') return
  const payload = readUtmParams()
  if (!shouldTrack(payload)) return

  const fp = sessionFingerprint(payload)
  try {
    if (sessionStorage.getItem(SESSION_KEY) === fp) return
  } catch {
    /* private mode */
  }

  try {
    await api.post('/scraping/marketing-visit/', payload, { timeout: 8000 })
    try {
      sessionStorage.setItem(SESSION_KEY, fp)
    } catch {
      /* ignore */
    }
  } catch {
    /* non-blocking analytics */
  }
}
