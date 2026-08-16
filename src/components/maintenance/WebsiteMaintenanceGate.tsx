import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Languages, Mail, RefreshCw, Wrench } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getApiBaseUrl } from '@/lib/apiBase'
import { isStaffRole } from '@/utils/authRedirect'
import './website-maintenance.css'

type MaintenanceSettings = {
  enabled: boolean
  title_ar: string
  title_en: string
  message_ar: string
  message_en: string
  expected_back_at: string | null
  support_email: string
}

const POLL_MS = 30_000
const REQUEST_TIMEOUT_MS = 3_000

/** Paths that must stay reachable while the public storefront is offline. */
const BYPASS_PREFIXES = [
  '/admin',
  '/login',
  '/register',
  '/forgot-password',
  '/company-login',
  '/payment-receipt/',
  '/sso-callback',
  '/mobile-auth-done',
]

function bypassMaintenance(pathname: string): boolean {
  return BYPASS_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return pathname.startsWith(prefix)
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

async function fetchMaintenanceSettings(signal: AbortSignal): Promise<MaintenanceSettings> {
  const response = await fetch(`${getApiBaseUrl()}/accounts/website-maintenance/`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`maintenance_status_${response.status}`)
  return (await response.json()) as MaintenanceSettings
}

/**
 * Public storefront maintenance gate.
 * Mount after GlobalBootGate (auth ready) and inside Router so staff can
 * still reach /admin and sign-in routes during an outage.
 */
export default function WebsiteMaintenanceGate({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null)
  const [resolved, setResolved] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const staffBypass = isStaffRole(user?.role)
  const pathBypass = bypassMaintenance(pathname)
  const bypassed = staffBypass || pathBypass

  const check = useCallback(async (manual = false) => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    if (manual) setRefreshing(true)

    try {
      const next = await fetchMaintenanceSettings(controller.signal)
      setSettings(next)
    } catch {
      // Fail open. A temporary status API problem must not take the storefront offline.
      setSettings((current) => current)
    } finally {
      window.clearTimeout(timeout)
      setResolved(true)
      if (manual) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (bypassed) {
      setResolved(true)
      return
    }
    void check()
    const interval = window.setInterval(() => void check(), POLL_MS)
    return () => window.clearInterval(interval)
  }, [bypassed, check])

  if (bypassed) return <>{children}</>

  if (!resolved) {
    return (
      <div className="gs-maintenance-loading" aria-label="Gold Standard">
        <img src="/brand/gold-standard-logo.svg" alt="Gold Standard" />
        <span />
      </div>
    )
  }

  if (!settings?.enabled) return <>{children}</>

  return (
    <MaintenanceScreen
      settings={settings}
      language={i18n.language?.startsWith('ar') ? 'ar' : 'en'}
      onLanguageChange={(language) => void i18n.changeLanguage(language)}
      onRefresh={() => void check(true)}
      refreshing={refreshing}
    />
  )
}

function MaintenanceScreen({
  settings,
  language,
  onLanguageChange,
  onRefresh,
  refreshing,
}: {
  settings: MaintenanceSettings
  language: 'ar' | 'en'
  onLanguageChange: (language: 'ar' | 'en') => void
  onRefresh: () => void
  refreshing: boolean
}) {
  const isArabic = language === 'ar'
  const copy = useMemo(
    () => ({
      title: isArabic ? settings.title_ar : settings.title_en,
      message: isArabic ? settings.message_ar : settings.message_en,
      serviceLabel: isArabic ? 'تحديثات مؤقتة' : 'Temporary service update',
      expectedLabel: isArabic ? 'العودة المتوقعة' : 'Expected return',
      refresh: isArabic ? 'التحقق مرة أخرى' : 'Check again',
      contact: isArabic ? 'تواصل معنا' : 'Contact us',
      reassurance: isArabic
        ? 'خدماتنا وبياناتكم بأمان. نعمل على العودة في أقرب وقت.'
        : 'Your services and information remain secure. We are working to return shortly.',
      languageLabel: isArabic ? 'English' : 'العربية',
    }),
    [isArabic, settings],
  )

  const expected = settings.expected_back_at
    ? new Intl.DateTimeFormat(isArabic ? 'ar-KW' : 'en-KW', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kuwait',
      }).format(new Date(settings.expected_back_at))
    : null

  useEffect(() => {
    const previousTitle = document.title
    const existingRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const previousRobots = existingRobots?.content
    const robots = existingRobots ?? document.createElement('meta')
    if (!existingRobots) {
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = 'noindex, nofollow'
    document.title = `${copy.title} | Gold Standard`

    return () => {
      document.title = previousTitle
      if (existingRobots) {
        existingRobots.content = previousRobots ?? ''
      } else {
        robots.remove()
      }
    }
  }, [copy.title])

  return (
    <main
      className="gs-maintenance"
      dir={isArabic ? 'rtl' : 'ltr'}
      lang={language}
      id="main-content"
    >
      <div className="gs-maintenance__ambient" aria-hidden="true" />
      <header className="gs-maintenance__topbar">
        <img
          className="gs-maintenance__logo"
          src="/brand/gold-standard-logo.svg"
          alt="Gold Standard"
        />
        <button
          type="button"
          className="gs-maintenance__language"
          onClick={() => onLanguageChange(isArabic ? 'en' : 'ar')}
          aria-label={copy.languageLabel}
        >
          <Languages aria-hidden="true" />
          <span>{copy.languageLabel}</span>
        </button>
      </header>

      <section className="gs-maintenance__content" aria-live="polite">
        <div className="gs-maintenance__mark" aria-hidden="true">
          <Wrench />
        </div>
        <p className="gs-maintenance__label">{copy.serviceLabel}</p>
        <h1>{copy.title}</h1>
        <p className="gs-maintenance__message">{copy.message}</p>

        {expected ? (
          <div className="gs-maintenance__expected">
            <span>{copy.expectedLabel}</span>
            <strong>{expected}</strong>
          </div>
        ) : null}

        <p className="gs-maintenance__reassurance">{copy.reassurance}</p>

        <div className="gs-maintenance__actions">
          <button
            type="button"
            className="gs-maintenance__primary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? 'is-spinning' : ''} aria-hidden="true" />
            <span>{copy.refresh}</span>
          </button>
          {settings.support_email ? (
            <a
              className="gs-maintenance__secondary"
              href={`mailto:${settings.support_email}`}
            >
              <Mail aria-hidden="true" />
              <span>{copy.contact}</span>
            </a>
          ) : null}
        </div>
      </section>

      <footer className="gs-maintenance__footer">
        <span>Gold Standard Kuwait</span>
        {settings.support_email ? <span>{settings.support_email}</span> : null}
      </footer>
    </main>
  )
}
