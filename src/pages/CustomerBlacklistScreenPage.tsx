import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Gauge, ShieldCheck, Zap } from 'lucide-react'
import { CustomerBlacklistScreenPanel } from '@/components/compliance/CustomerBlacklistScreenPanel'
import { ScreeningLiveTicker } from '@/components/compliance/ScreeningLiveTicker'
import { blacklistScreeningApi } from '@/services/blacklistScreeningApi'
import { loadScreeningSession } from '@/lib/screeningTicker'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

/** GS name screening console — public tool at /gs-kyc */
export default function CustomerBlacklistScreenPage() {
  const { t } = useTranslation()
  const [totalIndexed, setTotalIndexed] = useState<number | null>(null)
  const [sampleNames, setSampleNames] = useState<string[]>([])
  const [screensToday, setScreensToday] = useState(() => loadScreeningSession().screensToday)
  const [tickerKey, setTickerKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    void blacklistScreeningApi
      .getStats()
      .then((data) => {
        if (cancelled || !data.ok) return
        setTotalIndexed(data.totalNames)
        const sample = Array.isArray(data.sampleNames)
          ? data.sampleNames
          : Array.isArray(data.recentNames)
            ? data.recentNames
            : []
        setSampleNames(sample.slice(0, 40))
      })
      .catch(() => {
        if (!cancelled) {
          setTotalIndexed(null)
          setSampleNames([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [tickerKey])

  const onScreenComplete = useCallback(() => {
    setScreensToday(loadScreeningSession().screensToday)
    setTickerKey((k) => k + 1)
  }, [])

  const metrics = [
    {
      key: 'latency',
      icon: Gauge,
      value: t('customerScreening.metrics.latencyValue'),
      label: t('customerScreening.metrics.latencyLabel'),
    },
    {
      key: 'registry',
      icon: Database,
      value:
        totalIndexed != null && totalIndexed > 0
          ? formatCount(totalIndexed)
          : t('customerScreening.metrics.registryFallback'),
      label: t('customerScreening.metrics.registryLabel'),
    },
    {
      key: 'session',
      icon: Zap,
      value: formatCount(screensToday),
      label: t('customerScreening.metrics.sessionLabel'),
    },
  ] as const

  return (
    <div className="storefront-static-page min-h-[100dvh] bg-[#F4F5F1]">
      <ScreeningLiveTicker key={tickerKey} sampleNames={sampleNames} />

      <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#FAFBFA]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 80% 0%, rgba(133,227,7,0.14), transparent 50%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(63,111,0,0.06), transparent 45%)',
          }}
          aria-hidden
        />
        <div className="page-shell relative px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-[#85E307]/40 bg-[#ECFCCB] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#3F6F00]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {t('customerScreening.kicker')}
            </span>
            <span className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-[#0B0F19]">
              {t('customerScreening.freeBadge')}
            </span>
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-[#0B0F19] text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {t('customerScreening.title')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#475569] sm:text-xl sm:leading-relaxed">
            {t('customerScreening.intro')}
          </p>
          <p className="mt-3 max-w-2xl text-base font-medium text-[#3F6F00] sm:text-lg">
            {t('customerScreening.introHook')}
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {metrics.map((m) => {
              const Icon = m.icon
              return (
                <div
                  key={m.key}
                  className="rounded-2xl border border-black/[0.07] bg-white/90 px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                      {m.label}
                    </p>
                    <Icon className="h-4 w-4 text-[#3F6F00]" strokeWidth={1.75} aria-hidden />
                  </div>
                  <p className="font-mono text-2xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-3xl">
                    {m.value}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="page-shell px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          {(['search', 'report', 'data'] as const).map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-black/[0.07] bg-white px-5 py-5 sm:px-6"
            >
              <h2 className="text-xl font-bold tracking-tight text-[#0B0F19] sm:text-2xl">
                {t(`customerScreening.features.${key}.title`)}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[#64748B] sm:text-[17px]">
                {t(`customerScreening.features.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        <CustomerBlacklistScreenPanel
          totalIndexed={totalIndexed}
          onScreenComplete={onScreenComplete}
        />

        <p className="mx-auto mt-10 max-w-3xl text-center text-base leading-relaxed text-[#64748B] sm:text-lg">
          {t('customerScreening.footerPitch')}
        </p>
      </section>
    </div>
  )
}
