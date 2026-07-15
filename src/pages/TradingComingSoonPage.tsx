import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ChartCandlestick, ShieldCheck, LineChart, Lock } from 'lucide-react'

/** Public trading desk target — ~2 months from mid-July 2026 */
export const TRADING_LAUNCH_AT = new Date('2026-09-15T09:00:00+03:00')

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const totalSec = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    done: false,
  }
}

const PILLARS = [
  { id: 'live', icon: LineChart },
  { id: 'custody', icon: Lock },
  { id: 'compliance', icon: ShieldCheck },
] as const

export default function TradingComingSoonPage() {
  const { t, i18n } = useTranslation()
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(TRADING_LAUNCH_AT))

  useEffect(() => {
    const id = window.setInterval(() => setTimeLeft(getTimeLeft(TRADING_LAUNCH_AT)), 1000)
    return () => window.clearInterval(id)
  }, [])

  const launchLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(i18n.language?.startsWith('ar') ? 'ar-KW' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(TRADING_LAUNCH_AT)
    } catch {
      return '15 September 2026'
    }
  }, [i18n.language])

  const units = [
    { key: 'days', value: timeLeft.days },
    { key: 'hours', value: timeLeft.hours },
    { key: 'minutes', value: timeLeft.minutes },
    { key: 'seconds', value: timeLeft.seconds },
  ] as const

  return (
    <div className="storefront-static-page min-h-screen">
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/45 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(133,227,7,0.14),transparent_55%)]" />
        </div>

        <div className="relative page-shell page-section--roomy">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3F6F00]/15 bg-[#ECFCCB]/80 px-3 py-1.5">
            <ChartCandlestick className="h-3.5 w-3.5 text-[#3F6F00]" strokeWidth={2} aria-hidden />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3F6F00]">
              {t('tradingPage.badge')}
            </span>
          </div>

          <h1 className="store-display-title mt-5 max-w-3xl text-[#0B0F19]">
            {t('tradingPage.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            {t('tradingPage.subtitle')}
          </p>

          <div className="mt-8 max-w-2xl rounded-2xl border border-black/10 bg-[#F9F9FA] p-5 sm:p-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B]">
              {timeLeft.done ? t('tradingPage.countdownReady') : t('tradingPage.countdownLabel')}
            </p>
            {!timeLeft.done ? (
              <p className="mt-1 text-sm text-[#94A3B8]">
                {t('tradingPage.launchDate', { date: launchLabel })}
              </p>
            ) : null}

            <div
              className="mt-5 grid grid-cols-4 gap-2 sm:gap-3"
              role="timer"
              aria-live="polite"
              aria-atomic="true"
            >
              {units.map((unit) => (
                <div
                  key={unit.key}
                  className="rounded-xl border border-black/10 bg-white px-2 py-3 text-center sm:px-3 sm:py-4"
                >
                  <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-3xl">
                    {String(unit.value).padStart(2, '0')}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8] sm:text-[11px]">
                    {t(`tradingPage.units.${unit.key}`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/products"
              className="gold-button inline-flex w-full items-center justify-center gap-2 shadow-md sm:w-auto"
            >
              {t('tradingPage.ctaShop')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex w-full items-center justify-center rounded-lg border border-black/10 bg-white px-6 py-3 font-semibold text-[#0B0F19] transition-colors hover:bg-[#F4F4F5] sm:w-auto"
            >
              {t('tradingPage.ctaNotify')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="mb-8 max-w-2xl">
            <p className="page-kicker">{t('tradingPage.pillarsKicker')}</p>
            <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('tradingPage.pillarsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('tradingPage.pillarsBody')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PILLARS.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/10 bg-[#F9F9FA] p-5 sm:p-6"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-[11px] font-semibold tabular-nums text-[#94A3B8]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-[#0B0F19]">
                    {t(`tradingPage.pillars.${item.id}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#64748B]">
                    {t(`tradingPage.pillars.${item.id}.description`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="storefront-static-page__tail pb-14 sm:pb-16">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] px-5 py-8 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(133,227,7,0.16),transparent_55%)]" />
            <div className="relative max-w-2xl">
              <p className="page-kicker text-[#85E307]">{t('tradingPage.noteKicker')}</p>
              <h2 className="type-section-title text-white sm:text-2xl">
                {t('tradingPage.noteTitle')}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                {t('tradingPage.noteBody')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
