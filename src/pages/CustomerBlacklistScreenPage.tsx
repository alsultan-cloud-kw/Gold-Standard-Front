import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Gauge, ShieldCheck, Zap } from 'lucide-react'
import { CustomerBlacklistScreenPanel } from '@/components/compliance/CustomerBlacklistScreenPanel'
import { ScreeningConsoleSidebar } from '@/components/compliance/ScreeningConsoleSidebar'
import { ScreeningLiveTicker } from '@/components/compliance/ScreeningLiveTicker'
import { blacklistScreeningApi } from '@/services/blacklistScreeningApi'
import { loadScreeningSession, loadTickerCache, saveTickerCache } from '@/lib/screeningTicker'
import { usePageEnter } from '@/motion/usePageEnter'
import {
  loadActiveTab,
  loadScreenHistory,
  loadWatchlist,
  saveActiveTab,
  type LocalScreenRecord,
  type ScreeningConsoleTab,
} from '@/lib/screeningConsoleStorage'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

/** GS name screening console — public tool at /gs-kyc */
export default function CustomerBlacklistScreenPage() {
  const { t } = useTranslation()
  const rootRef = usePageEnter()
  const [totalIndexed, setTotalIndexed] = useState<number | null>(
    () => loadTickerCache().totalIndexed,
  )
  const [sampleNames, setSampleNames] = useState<string[]>(() => loadTickerCache().sampleNames)
  const [tickerLoading, setTickerLoading] = useState(
    () => loadTickerCache().sampleNames.length === 0,
  )
  const [screensToday, setScreensToday] = useState(() => loadScreeningSession().screensToday)
  const [tickerKey, setTickerKey] = useState(0)
  const [tab, setTab] = useState<ScreeningConsoleTab>(() => loadActiveTab())
  const [history, setHistory] = useState<LocalScreenRecord[]>(() => loadScreenHistory())
  const [watchlist, setWatchlist] = useState<string[]>(() => loadWatchlist())
  const [focusToken, setFocusToken] = useState(0)
  const [seedQuery, setSeedQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    const hadCache = loadTickerCache().sampleNames.length > 0
    if (!hadCache) setTickerLoading(true)

    void blacklistScreeningApi
      .getStats()
      .then((data) => {
        if (cancelled || !data.ok) return
        const sample = (
          Array.isArray(data.sampleNames)
            ? data.sampleNames
            : Array.isArray(data.recentNames)
              ? data.recentNames
              : []
        )
          .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
          .slice(0, 40)

        setTotalIndexed(data.totalNames)
        if (sample.length > 0) {
          setSampleNames(sample)
          saveTickerCache(sample, data.totalNames)
        } else {
          saveTickerCache(loadTickerCache().sampleNames, data.totalNames)
        }
      })
      .catch(() => {
        /* keep cached ticker visible */
      })
      .finally(() => {
        if (!cancelled) setTickerLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tickerKey])

  const selectTab = useCallback((next: ScreeningConsoleTab) => {
    setTab(next)
    saveActiveTab(next)
    if (next === 'history') setHistory(loadScreenHistory())
    if (next === 'watchlist') setWatchlist(loadWatchlist())
  }, [])

  const onNewVerification = useCallback(() => {
    setSeedQuery('')
    setFocusToken((n) => n + 1)
    selectTab('screening')
  }, [selectTab])

  const onScreenComplete = useCallback(() => {
    setScreensToday(loadScreeningSession().screensToday)
    setHistory(loadScreenHistory())
    setTickerKey((k) => k + 1)
  }, [])

  const screenFromList = useCallback(
    (name: string) => {
      setSeedQuery(name)
      setFocusToken((n) => n + 1)
      selectTab('screening')
    },
    [selectTab],
  )

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
    <div className="storefront-static-page min-h-[100dvh] bg-[#F4F5F1]" ref={rootRef}>
      <ScreeningLiveTicker
        key={tickerKey}
        sampleNames={sampleNames}
        loading={tickerLoading}
      />

      <div className="lg:grid lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <div className="border-b border-black/[0.06] lg:border-b-0">
          <ScreeningConsoleSidebar
            active={tab}
            onChange={selectTab}
            totalIndexed={totalIndexed}
            onNewVerification={onNewVerification}
          />
        </div>

        <div className="min-w-0">
          {tab === 'overview' ? (
            <section className="relative overflow-hidden border-b border-black/[0.06] bg-[#FAFBFA]">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 70% 60% at 80% 0%, rgba(133,227,7,0.14), transparent 50%), radial-gradient(ellipse 50% 40% at 10% 100%, rgba(63,111,0,0.06), transparent 45%)',
                }}
                aria-hidden
              />
              <div className="relative px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
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
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#475569] sm:text-xl">
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
                        className="rounded-2xl border border-black/[0.07] bg-white/90 px-5 py-4"
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

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {(['search', 'report', 'data'] as const).map((key) => (
                    <div
                      key={key}
                      className="rounded-2xl border border-black/[0.07] bg-white px-5 py-5"
                    >
                      <h2 className="text-xl font-bold tracking-tight text-[#0B0F19]">
                        {t(`customerScreening.features.${key}.title`)}
                      </h2>
                      <p className="mt-2 text-base leading-relaxed text-[#64748B]">
                        {t(`customerScreening.features.${key}.body`)}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onNewVerification}
                  className="mt-8 inline-flex rounded-xl bg-[#0B0F19] px-6 py-3.5 text-base font-bold text-[#85E307] transition hover:bg-[#161c2c]"
                >
                  {t('customerScreening.console.newVerification')}
                </button>
              </div>
            </section>
          ) : null}

          {tab === 'screening' ? (
            <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
              <CustomerBlacklistScreenPanel
                totalIndexed={totalIndexed}
                onScreenComplete={onScreenComplete}
                focusToken={focusToken}
                seedQuery={seedQuery}
              />
              <p className="mx-auto mt-8 max-w-3xl text-center text-base leading-relaxed text-[#64748B]">
                {t('customerScreening.footerPitch')}
              </p>
            </section>
          ) : null}

          {tab === 'history' ? (
            <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-[#0B0F19]">
                {t('customerScreening.console.historyTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-base text-[#64748B]">
                {t('customerScreening.console.historyBody')}
              </p>
              {history.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-dashed border-black/10 bg-white px-5 py-8 text-center text-[#64748B]">
                  {t('customerScreening.console.historyEmpty')}
                </p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {history.map((row) => (
                    <li
                      key={row.referenceId}
                      className="flex flex-col gap-3 rounded-2xl border border-black/[0.07] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-[#0B0F19]">{row.query}</p>
                        <p className="mt-1 font-mono text-xs text-[#94A3B8]">
                          {row.referenceId} ·{' '}
                          {new Date(row.at).toLocaleString('en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        <p className="mt-1 text-sm text-[#64748B]">
                          {row.matched
                            ? t('customerScreening.console.historyMatched')
                            : t('customerScreening.console.historyClear')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => screenFromList(row.query)}
                        className="shrink-0 rounded-xl border border-[#85E307]/40 bg-[#ECFCCB] px-4 py-2 text-sm font-bold text-[#3F6F00]"
                      >
                        {t('customerScreening.console.rescreen')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === 'watchlist' ? (
            <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-[#0B0F19]">
                {t('customerScreening.console.watchTitle')}
              </h2>
              <p className="mt-2 max-w-2xl text-base text-[#64748B]">
                {t('customerScreening.console.watchBody')}
              </p>
              {watchlist.length === 0 ? (
                <p className="mt-8 rounded-2xl border border-dashed border-black/10 bg-white px-5 py-8 text-center text-[#64748B]">
                  {t('customerScreening.console.watchEmpty')}
                </p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {watchlist.map((name) => (
                    <li
                      key={name}
                      className="flex flex-col gap-3 rounded-2xl border border-black/[0.07] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-lg font-semibold text-[#0B0F19]">{name}</p>
                      <button
                        type="button"
                        onClick={() => screenFromList(name)}
                        className="shrink-0 rounded-xl bg-[#0B0F19] px-4 py-2 text-sm font-bold text-[#85E307]"
                      >
                        {t('customerScreening.console.rescreen')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {tab === 'reporting' ? (
            <section className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
              <h2 className="text-3xl font-bold tracking-tight text-[#0B0F19]">
                {t('customerScreening.console.reportTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[#64748B]">
                {t('customerScreening.console.reportBody')}
              </p>
              <div className="mt-8 rounded-2xl border border-[#85E307]/30 bg-[#F4FBEF] px-6 py-6">
                <p className="text-base font-semibold text-[#0B0F19]">
                  {t('customerScreening.console.reportNote')}
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
