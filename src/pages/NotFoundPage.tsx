import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Home,
  Package,
  TrendingUp,
  MessageCircle,
  ShieldCheck,
  Phone,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { GS_CONTACT } from '@/constants/contact'

const QUICK_LINKS = [
  { to: '/', icon: Home, labelKey: 'notFoundPage.links.home' },
  { to: '/products', icon: Package, labelKey: 'notFoundPage.links.shop' },
  { to: '/prices', icon: TrendingUp, labelKey: 'notFoundPage.links.prices' },
  { to: '/verify', icon: ShieldCheck, labelKey: 'notFoundPage.links.verify' },
  { to: '/contact', icon: MessageCircle, labelKey: 'notFoundPage.links.contact' },
] as const

const TRUST_KEYS = ['moci', 'insured', 'licensed'] as const

export default function NotFoundPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const attemptedPath = location.pathname + location.search

  useEffect(() => {
    document.title = t('notFoundPage.documentTitle')
    return () => {
      document.title = t('common.defaultDocumentTitle')
    }
  }, [t])

  return (
    <section className="relative min-h-[calc(100dvh-7.25rem)] overflow-hidden bg-[var(--site-bg)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(133, 227, 7, 0.1) 0%, transparent 65%)',
        }}
      />

      <div className="page-shell relative px-[var(--page-gutter)] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Message */}
          <div className="text-center lg:text-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#3F6F00]">
              {t('notFoundPage.kicker')}
            </p>

            <div className="mt-4 flex items-center justify-center gap-4 lg:justify-start">
              <span
                className="select-none text-[clamp(4.5rem,14vw,7.5rem)] font-bold leading-none tracking-tighter text-[#0B0F19]/[0.07]"
                aria-hidden
              >
                404
              </span>
              <div className="text-start">
                <h1 className="type-page-title text-[#0B0F19] sm:text-3xl lg:text-4xl">
                  {t('notFoundPage.title')}
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#64748B] sm:text-base">
                  {t('notFoundPage.subtitle')}
                </p>
              </div>
            </div>

            {attemptedPath && attemptedPath !== '/' ? (
              <p className="mx-auto mt-5 max-w-md rounded-xl border border-black/8 bg-white/80 px-4 py-3 text-start text-xs text-[#94A3B8] lg:mx-0">
                <span className="font-semibold text-[#64748B]">{t('notFoundPage.requested')}</span>
                <code className="mt-1 block break-all font-mono text-[11px] text-[#0B0F19]">
                  {attemptedPath}
                </code>
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link to="/" className="ds-btn-accent inline-flex items-center justify-center gap-2 px-7 py-3.5">
                {t('notFoundPage.backHome')}
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              </Link>
              <Link to="/products" className="ds-btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3.5">
                {t('notFoundPage.shopGold')}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {TRUST_KEYS.map((key) => (
                <li key={key} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#85E307]" aria-hidden />
                  {t(`notFoundPage.trust.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Help panel */}
          <div className="gs-loader-shell mx-auto w-full max-w-md lg:max-w-none">
            <div className="gs-loader-panel px-6 py-7 sm:px-8 sm:py-8">
              <div className="mb-6 flex items-center gap-3 border-b border-black/5 pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B0F19]">
                  <img src={logo} alt="" aria-hidden className="h-5 w-auto object-contain" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#0B0F19]">{t('notFoundPage.panelTitle')}</p>
                  <p className="text-xs text-[#94A3B8]">{t('notFoundPage.panelSubtitle')}</p>
                </div>
              </div>

              <nav aria-label={t('notFoundPage.navLabel')}>
                <ul className="space-y-1">
                  {QUICK_LINKS.map(({ to, icon: Icon, labelKey }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0B0F19] transition-colors hover:bg-[#ECFCCB]/60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F4F5] text-[#3F6F00] transition-colors group-hover:bg-[#ECFCCB]">
                          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">{t(labelKey)}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[#94A3B8] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-6 rounded-xl border border-black/5 bg-[#F9F9FA] px-4 py-3.5">
                <p className="text-xs font-semibold text-[#64748B]">{t('notFoundPage.needHelp')}</p>
                <a
                  href={`tel:${GS_CONTACT.phoneTel}`}
                  className="mt-1.5 inline-flex items-center gap-2 text-sm font-bold text-[#3F6F00] transition-colors hover:text-[#4F8E00]"
                >
                  <Phone className="h-4 w-4 shrink-0" aria-hidden />
                  {GS_CONTACT.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
