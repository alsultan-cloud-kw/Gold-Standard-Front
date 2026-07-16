import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  blacklistScreeningApi,
  type BlacklistCheckResponse,
} from '@/services/blacklistScreeningApi'
import {
  bumpScreensToday,
  loadScreeningSession,
  saveScreeningSession,
} from '@/lib/screeningTicker'
import { sanitizeScreeningName } from '@/lib/screeningNameValidation'
import { pushScreenHistory, toggleWatchlistName } from '@/lib/screeningConsoleStorage'
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'

type ScreeningReport = {
  queriedAt: Date
  referenceId: string
  query: string
  result: BlacklistCheckResponse
}

const SCAN_STEP_KEYS = ['normalize', 'search', 'compile'] as const

function makeReferenceId(): string {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `GS-SCR-${stamp}-${rand}`
}

function formatReportTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatPct(n: number): string {
  return `${Math.round(n)}%`
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

type Props = {
  totalIndexed: number | null
  onScreenComplete?: () => void
  focusToken?: number
  seedQuery?: string
}

export function CustomerBlacklistScreenPanel({
  totalIndexed,
  onScreenComplete,
  focusToken = 0,
  seedQuery = '',
}: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(() => seedQuery || loadScreeningSession().lastQuery || '')
  const [checking, setChecking] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ScreeningReport | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchIconRef = useRef<HTMLSpanElement>(null)
  const overlayIconRef = useRef<HTMLDivElement>(null)
  const radarRef = useRef<HTMLDivElement>(null)

  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  useEffect(() => {
    if (!focusToken) return
    if (seedQuery) setQuery(seedQuery)
    inputRef.current?.focus()
  }, [focusToken, seedQuery])

  useEffect(() => {
    if (!checking) return
    setScanStep(0)
    setScanProgress(8)
    const t1 = window.setTimeout(() => {
      setScanStep(1)
      setScanProgress(42)
    }, 520)
    const t2 = window.setTimeout(() => {
      setScanStep(2)
      setScanProgress(78)
    }, 1100)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [checking])

  /* Idle search icon — gentle orbit + pulse */
  useEffect(() => {
    if (checking || !searchIconRef.current) return
    const el = searchIconRef.current
    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -3,
        duration: 1.1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to(el, {
        rotate: 12,
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.15,
      })
    })
    return () => ctx.revert()
  }, [checking])

  /* Full-screen overlay: sweeping radar + roaming search */
  useEffect(() => {
    if (!checking) return
    const icon = overlayIconRef.current
    const radar = radarRef.current
    if (!icon || !radar) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        icon,
        { scale: 0.85, opacity: 0.7 },
        {
          scale: 1.08,
          opacity: 1,
          duration: 0.9,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        },
      )
      gsap.to(icon, {
        x: 28,
        y: -18,
        duration: 1.4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to(icon, {
        rotate: 360,
        duration: 3.2,
        repeat: -1,
        ease: 'none',
      })
      gsap.fromTo(
        radar,
        { scale: 0.35, opacity: 0.55 },
        {
          scale: 1.55,
          opacity: 0,
          duration: 1.45,
          repeat: -1,
          ease: 'power1.out',
        },
      )
    })
    return () => ctx.revert()
  }, [checking])

  const runScreening = useCallback(async () => {
    const { clean, error: nameErr } = sanitizeScreeningName(query)
    if (nameErr || !clean) {
      setError(t(`customerScreening.validation.${nameErr || 'name_required'}`))
      return
    }
    if (checking) return
    if (isTurnstileConfigured && !turnstileToken) {
      setError(t('customerScreening.captchaRequired'))
      return
    }

    setChecking(true)
    setError(null)
    setReport(null)
    setScanProgress(12)
    saveScreeningSession({ lastQuery: clean })

    try {
      const json = await blacklistScreeningApi.checkName(clean, turnstileToken || undefined)
      if (json && typeof json === 'object' && 'ok' in json && json.ok === false) {
        const code = json.error || ''
        if (code === 'captcha_failed') throw new Error(t('customerScreening.captchaFailed'))
        if (code.startsWith('name_')) throw new Error(t(`customerScreening.validation.${code}`))
        throw new Error(
          code === 'screening_unavailable'
            ? t('customerScreening.unavailable')
            : code || t('customerScreening.checkFailed'),
        )
      }
      const result: BlacklistCheckResponse = {
        matched: Boolean(json.matched),
        matchType: json.matchType ?? null,
        originalName: json.originalName ?? null,
        similarityScore: json.similarityScore ?? null,
        normalizedName: json.normalizedName ?? '',
        matches: Array.isArray(json.matches)
          ? json.matches
              .filter((m) => m && typeof m.originalName === 'string')
              .map((m) => ({
                originalName: m.originalName,
                similarityScore: Number(m.similarityScore ?? 0),
              }))
          : json.matched && json.originalName
            ? [
                {
                  originalName: json.originalName,
                  similarityScore: Number(json.similarityScore ?? 1),
                },
              ]
            : [],
        referenceId: json.referenceId,
      }
      setScanProgress(100)
      await new Promise((r) => window.setTimeout(r, 320))
      const referenceId = (json.referenceId || makeReferenceId()).trim()
      setReport({
        queriedAt: new Date(),
        referenceId,
        query: clean,
        result,
      })
      pushScreenHistory({
        referenceId,
        query: clean,
        matched: result.matched,
        matchType: result.matchType,
        similarityScore: result.similarityScore,
        matchedNames: result.matches.map((m) => m.originalName),
        at: new Date().toISOString(),
      })
      bumpScreensToday()
      saveScreeningSession({ lastQuery: clean, lastReferenceId: referenceId })
      clearTurnstile()
      onScreenComplete?.()
    } catch (e) {
      clearTurnstile()
      const axiosErr =
        e && typeof e === 'object' && 'response' in e
          ? (e as {
              response?: { status?: number; data?: { error?: string; detail?: string } }
              message?: string
            })
          : undefined
      const status = axiosErr?.response?.status
      const code = axiosErr?.response?.data?.error
      if (status === 404) {
        setError(t('customerScreening.endpointUnavailable'))
      } else if (code === 'captcha_failed') {
        setError(t('customerScreening.captchaFailed'))
      } else if (code && code.startsWith('name_')) {
        setError(t(`customerScreening.validation.${code}`))
      } else if (code === 'screening_unavailable' || status === 503) {
        setError(t('customerScreening.unavailable'))
      } else if (e instanceof Error && !/^Request failed with status code \d+$/i.test(e.message)) {
        setError(e.message)
      } else {
        setError(t('customerScreening.checkFailed'))
      }
    } finally {
      setChecking(false)
    }
  }, [checking, clearTurnstile, onScreenComplete, query, t, turnstileToken])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void runScreening()
  }

  const matchScore =
    report?.result.similarityScore != null
      ? Math.round(report.result.similarityScore * 100)
      : report?.result.matchType === 'exact'
        ? 100
        : 0

  const isExactMatch = report?.result.matchType === 'exact'
  const isFuzzyMatch = report?.result.matchType === 'fuzzy'

  const matchStatusLabel = report?.result.matched
    ? isExactMatch
      ? t('customerScreening.statusMatchExact')
      : t('customerScreening.statusMatchFuzzy')
    : t('customerScreening.statusClear')

  const matchTypeLabel = isExactMatch
    ? t('customerScreening.matchExact')
    : isFuzzyMatch
      ? t('customerScreening.matchFuzzy')
      : '—'

  return (
    <>
      {/* Immersive full-screen search */}
      {checking ? (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#F7F8F5]/97 backdrop-blur-md"
          role="alertdialog"
          aria-busy="true"
          aria-labelledby="gs-screening-overlay-title"
        >
          <div className="relative mb-10 flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
            <div
              ref={radarRef}
              className="absolute inset-0 rounded-full border-2 border-[#85E307]/50"
              aria-hidden
            />
            <div
              className="absolute inset-4 rounded-full border border-[#85E307]/25"
              aria-hidden
            />
            <div
              ref={overlayIconRef}
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0B0F19] text-[#85E307] shadow-[0_20px_50px_rgba(133,227,7,0.25)] sm:h-24 sm:w-24"
            >
              <Search className="h-9 w-9 sm:h-10 sm:w-10" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <p
            id="gs-screening-overlay-title"
            className="max-w-xl px-6 text-center text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-4xl"
          >
            {t('customerScreening.overlayTitle')}
          </p>
          <p className="mt-3 max-w-lg px-6 text-center text-base text-[#64748B] sm:text-lg">
            {t(`customerScreening.step.${SCAN_STEP_KEYS[scanStep]}`)}
          </p>

          <div className="mt-8 w-full max-w-md px-6">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold">
              <span className="text-[#3F6F00]">{t('customerScreening.scanning')}</span>
              <span className="font-mono tabular-nums text-[#0B0F19]">{scanProgress}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3F6F00] via-[#85E307] to-[#ECFCCB] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="mt-4 text-center font-mono text-sm text-[#94A3B8]">{query.trim()}</p>
          </div>
        </div>
      ) : null}

      <section
        className="relative overflow-hidden rounded-[1.75rem] border border-black/[0.08] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        aria-labelledby="customer-screening-title"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(133,227,7,0.18), transparent 55%)',
          }}
          aria-hidden
        />

        <div className="relative border-b border-black/[0.06] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t('customerScreening.panelKicker')}
              </p>
              <h2
                id="customer-screening-title"
                className="mt-3 text-3xl font-bold tracking-tight text-[#0B0F19] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
              >
                {t('customerScreening.panelTitle')}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg">
                {t('customerScreening.panelSubtitle')}
              </p>
            </div>

            {totalIndexed != null && totalIndexed > 0 ? (
              <div
                className="w-full shrink-0 rounded-2xl border border-[#85E307]/30 bg-[#F4FBEF] p-1 lg:w-[16rem]"
                aria-label={`${t('customerScreening.indexLabel')}: ${formatCount(totalIndexed)}`}
              >
                <div className="rounded-[0.95rem] bg-white px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3F6F00]/80">
                        {t('customerScreening.indexLabel')}
                      </p>
                      <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight text-[#0B0F19]">
                        {formatCount(totalIndexed)}
                      </p>
                      <p className="mt-1.5 text-xs text-[#64748B]">
                        {t('customerScreening.indexHint')}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#85E307]/35 bg-[#ECFCCB] text-[#3F6F00]">
                      <Database className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative space-y-5 px-5 py-6 sm:px-8 sm:py-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <label
              htmlFor="customer-screening-query"
              className="block text-base font-semibold text-[#0B0F19] sm:text-lg"
            >
              {t('customerScreening.queryLabel')}
            </label>

            <div className="rounded-[1.35rem] border border-black/[0.08] bg-[#F7F8F5] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <span
                    ref={searchIconRef}
                    className="pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 text-[#3F6F00] start-4"
                    aria-hidden
                  >
                    <Search className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                  </span>
                  <input
                    ref={inputRef}
                    id="customer-screening-query"
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder={t('customerScreening.placeholder')}
                    disabled={checking}
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={120}
                    className="w-full rounded-[1rem] border border-transparent bg-white py-4 text-lg font-medium text-[#0B0F19] outline-none transition placeholder:font-normal placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-4 focus:ring-[#85E307]/20 disabled:opacity-60 ps-12 pe-4 sm:py-5 sm:text-xl sm:ps-14"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    checking ||
                    !query.trim() ||
                    (isTurnstileConfigured && !turnstileToken)
                  }
                  className="inline-flex min-h-[3.5rem] min-w-[11rem] items-center justify-center gap-2 rounded-[1rem] bg-[#0B0F19] px-6 text-base font-bold text-[#85E307] transition hover:bg-[#161c2c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:text-lg"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('customerScreening.scanning')}
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5" strokeWidth={2} />
                      {t('customerScreening.run')}
                    </>
                  )}
                </button>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('customerScreening.hint')}
            </p>
            {isTurnstileConfigured ? (
              <div className="pt-1">
                <TurnstileWidget
                  ref={turnstileRef}
                  onToken={setTurnstileToken}
                  onExpire={clearTurnstile}
                  onError={clearTurnstile}
                  theme="light"
                />
                <p className="mt-2 text-xs text-[#94A3B8]">{t('customerScreening.captchaHint')}</p>
              </div>
            ) : null}
          </form>

          {error ? (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-base text-red-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {report && !checking ? (
            <article
              className={`overflow-hidden rounded-2xl border ${
                report.result.matched
                  ? 'border-amber-200 bg-white'
                  : 'border-[#85E307]/35 bg-white'
              }`}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 ${
                  report.result.matched
                    ? 'border-amber-100 bg-amber-50/90'
                    : 'border-[#ECFCCB] bg-[#F4FBEF]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {report.result.matched ? (
                    <ShieldAlert className="h-6 w-6 shrink-0 text-amber-700" aria-hidden />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 shrink-0 text-[#3F6F00]" aria-hidden />
                  )}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#64748B]">
                      {t('customerScreening.reportLabel')}
                    </p>
                    <p
                      className={`text-lg font-bold sm:text-xl ${
                        report.result.matched ? 'text-amber-950' : 'text-[#0B0F19]'
                      }`}
                    >
                      {matchStatusLabel}
                    </p>
                  </div>
                </div>
                <div className="text-end font-mono text-xs text-[#94A3B8]">
                  <p>{report.referenceId}</p>
                  <p className="mt-0.5">{formatReportTime(report.queriedAt)}</p>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {report.result.matched ? (
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.1fr] lg:items-center">
                    <div className="rounded-xl border border-black/[0.06] bg-[#F9F9FA] px-4 py-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
                        {t('customerScreening.formulaLabel')}
                      </p>
                      <p className="mt-1.5 text-base font-semibold text-[#0B0F19]">
                        {isExactMatch
                          ? t('customerScreening.formulaExact')
                          : t('customerScreening.formulaFuzzy')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-5xl font-bold tabular-nums tracking-tight text-[#3F6F00]">
                        {formatPct(matchScore)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#64748B]">
                        {t('customerScreening.similarity')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-black/[0.06] bg-[#F9F9FA] px-4 py-3.5">
                      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                        <span className="font-semibold text-[#64748B]">
                          {t('customerScreening.similarityIndex')}
                        </span>
                        <span className="font-mono font-bold tabular-nums text-[#0B0F19]">
                          {formatPct(matchScore)}
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3F6F00] to-[#85E307]"
                          style={{ width: `${Math.min(100, matchScore)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReportField
                    label={t('customerScreening.fieldQuery')}
                    value={report.query}
                    highlight
                  />
                  <ReportField
                    label={t('customerScreening.fieldNormalized')}
                    value={report.result.normalizedName || '—'}
                    mono
                  />
                  {report.result.matched ? (
                    <>
                      <RegistryNamesField
                        label={t('customerScreening.fieldListRecord')}
                        matches={
                          report.result.matches.length > 0
                            ? report.result.matches
                            : report.result.originalName
                              ? [
                                  {
                                    originalName: report.result.originalName,
                                    similarityScore: report.result.similarityScore ?? 1,
                                  },
                                ]
                              : []
                        }
                      />
                      <ReportField
                        label={t('customerScreening.fieldMatchType')}
                        value={matchTypeLabel}
                      />
                    </>
                  ) : null}
                </div>

                {report.result.matched ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-base leading-relaxed text-amber-950">
                    {isExactMatch
                      ? t('customerScreening.matchAdviceExact')
                      : t('customerScreening.matchAdviceFuzzy')}
                    {isExactMatch ? (
                      <span className="mt-2 block text-sm font-semibold text-amber-800">
                        {t('customerScreening.similarityExactNote')}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="rounded-xl border border-[#85E307]/25 bg-[#F4FBEF] px-4 py-3.5 text-base leading-relaxed text-[#0B0F19]">
                    {t('customerScreening.clearAdvice', { name: report.query })}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.05] pt-3">
                  <p className="inline-flex items-center gap-1.5 text-sm text-[#94A3B8]">
                    <FileText className="h-4 w-4" aria-hidden />
                    {t('customerScreening.reportFooter')}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        toggleWatchlistName(report.query)
                      }}
                      className="text-sm font-semibold text-[#64748B] transition hover:text-[#0B0F19]"
                    >
                      {t('customerScreening.saveWatchlist')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReport(null)
                        setQuery('')
                        saveScreeningSession({ lastQuery: '' })
                        inputRef.current?.focus()
                      }}
                      className="text-base font-bold text-[#3F6F00] transition hover:text-[#0B0F19]"
                    >
                      {t('customerScreening.newSearch')}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          <p className="text-sm leading-relaxed text-[#94A3B8]">{t('customerScreening.attribution')}</p>
        </div>
      </section>
    </>
  )
}

function RegistryNamesField({
  label,
  matches,
}: {
  label: string
  matches: { originalName: string; similarityScore: number }[]
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#F9F9FA] px-4 py-3.5 sm:col-span-2">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
      {matches.length === 0 ? (
        <p className="text-base text-[#334155]">—</p>
      ) : (
        <ul className="space-y-2">
          {matches.map((hit, index) => (
            <li
              key={`${hit.originalName}-${index}`}
              className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.04] pb-2 last:border-0 last:pb-0"
            >
              <span className="text-base font-semibold text-[#0B0F19] sm:text-lg">
                {hit.originalName}
              </span>
              <span className="font-mono text-sm tabular-nums text-[#3F6F00]">
                {formatPct(hit.similarityScore * 100)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ReportField({
  label,
  value,
  highlight,
  mono,
}: {
  label: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#F9F9FA] px-4 py-3.5">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p
        className={`break-words text-base sm:text-lg ${
          mono
            ? 'font-mono text-[#475569]'
            : highlight
              ? 'font-semibold text-[#0B0F19]'
              : 'text-[#334155]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
