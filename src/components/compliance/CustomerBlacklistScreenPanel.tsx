import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Fingerprint,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import {
  blacklistScreeningApi,
  type BlacklistCheckResponse,
} from '@/services/blacklistScreeningApi'

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

function formatReportTime(date: Date, isAr: boolean): string {
  return date.toLocaleString(isAr ? 'ar-KW' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

type Props = {
  totalIndexed: number | null
}

export function CustomerBlacklistScreenPanel({ totalIndexed }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [query, setQuery] = useState('')
  const [checking, setChecking] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [scanProgress, setScanProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<ScreeningReport | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const runScreening = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed || checking) return

    setChecking(true)
    setError(null)
    setReport(null)
    setScanProgress(12)

    try {
      const json = await blacklistScreeningApi.checkName(trimmed)
      if (json && typeof json === 'object' && 'ok' in json && json.ok === false) {
        throw new Error(
          json.error === 'screening_unavailable'
            ? t('customerScreening.unavailable')
            : json.error || t('customerScreening.checkFailed'),
        )
      }
      const result: BlacklistCheckResponse = {
        matched: Boolean(json.matched),
        matchType: json.matchType ?? null,
        originalName: json.originalName ?? null,
        similarityScore: json.similarityScore ?? null,
        normalizedName: json.normalizedName ?? '',
      }
      setScanProgress(100)
      await new Promise((r) => window.setTimeout(r, 280))
      setReport({
        queriedAt: new Date(),
        referenceId: makeReferenceId(),
        query: trimmed,
        result,
      })
    } catch (e) {
      const axiosErr =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { status?: number; data?: { error?: string } }; message?: string })
          : undefined
      const status = axiosErr?.response?.status
      const code = axiosErr?.response?.data?.error
      if (status === 404) {
        setError(t('customerScreening.endpointUnavailable'))
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
  }, [checking, query, t])

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
    <section
      className="overflow-hidden rounded-2xl border border-black/10 bg-[#0B0F19] text-white shadow-xl"
      aria-labelledby="customer-screening-title"
    >
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-xl bg-[#85E307]/15 p-2.5 ring-1 ring-[#85E307]/30">
              <Shield className="h-6 w-6 text-[#85E307]" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2
                id="customer-screening-title"
                className="text-base font-bold tracking-tight sm:text-lg"
              >
                {t('customerScreening.panelTitle')}
              </h2>
            </div>
          </div>
          {totalIndexed != null && totalIndexed > 0 ? (
            <div className="shrink-0 rounded-xl border border-[#85E307]/25 bg-[#85E307]/10 px-3 py-2 text-end">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#85E307]/80">
                {t('customerScreening.indexLabel')}
              </p>
              <p className="text-lg font-bold tabular-nums text-[#ECFCCB]">
                {totalIndexed.toLocaleString(isAr ? 'ar-KW' : 'en-US')}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <label htmlFor="customer-screening-query" className="sr-only">
            {t('customerScreening.placeholder')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 start-3"
                aria-hidden
              />
              <input
                ref={inputRef}
                id="customer-screening-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('customerScreening.placeholder')}
                disabled={checking}
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 text-sm text-white placeholder:text-white/35 focus:border-[#85E307]/50 focus:outline-none focus:ring-2 focus:ring-[#85E307]/20 disabled:opacity-60 ps-10 pe-4"
              />
            </div>
            <button
              type="submit"
              disabled={checking || !query.trim()}
              className="gold-button inline-flex min-w-[8.5rem] items-center justify-center gap-2 disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('customerScreening.scanning')}
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  {t('customerScreening.run')}
                </>
              )}
            </button>
          </div>
        </form>

        {checking ? (
          <div className="space-y-3 rounded-xl border border-[#85E307]/20 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-[#85E307]/90">
                {t(`customerScreening.step.${SCAN_STEP_KEYS[scanStep]}`)}
              </span>
              <span className="tabular-nums text-white/45">{scanProgress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#3F6F00] via-[#85E307] to-[#ECFCCB] transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {report && !checking ? (
          <article
            className={`overflow-hidden rounded-xl border ${
              report.result.matched
                ? 'border-red-500/35 bg-gradient-to-b from-red-950/50 to-black/40'
                : 'border-[#85E307]/30 bg-gradient-to-b from-[#3F6F00]/20 to-black/40'
            }`}
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
                report.result.matched
                  ? 'border-red-500/20 bg-red-500/10'
                  : 'border-[#85E307]/20 bg-[#85E307]/10'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {report.result.matched ? (
                  <ShieldAlert className="h-5 w-5 shrink-0 text-red-300" aria-hidden />
                ) : (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#85E307]" aria-hidden />
                )}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    {t('customerScreening.reportLabel')}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      report.result.matched ? 'text-red-100' : 'text-[#ECFCCB]'
                    }`}
                  >
                    {matchStatusLabel}
                  </p>
                </div>
              </div>
              <div className="text-end font-mono text-[10px] text-white/45">
                <p>{report.referenceId}</p>
                <p className="mt-0.5">{formatReportTime(report.queriedAt, Boolean(isAr))}</p>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReportField label={t('customerScreening.fieldQuery')} value={report.query} highlight />
                <ReportField
                  label={t('customerScreening.fieldNormalized')}
                  value={report.result.normalizedName || '—'}
                  mono
                />
                {report.result.matched ? (
                  <>
                    <ReportField
                      label={t('customerScreening.fieldListRecord')}
                      value={report.result.originalName ?? '—'}
                      highlight
                    />
                    <ReportField label={t('customerScreening.fieldMatchType')} value={matchTypeLabel} />
                  </>
                ) : null}
              </div>

              {report.result.matched ? (
                <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  {isFuzzyMatch ? (
                    <>
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-red-100/90">
                          {t('customerScreening.similarity')}
                        </span>
                        <span className="font-bold tabular-nums text-red-200">{matchScore}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-500 to-amber-400"
                          style={{ width: `${Math.min(100, matchScore)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] font-semibold text-red-100/90">
                      {t('customerScreening.similarityExactNote')}
                    </p>
                  )}
                  <p className="text-[11px] leading-relaxed text-red-200/80">
                    {isExactMatch
                      ? t('customerScreening.matchAdviceExact')
                      : t('customerScreening.matchAdviceFuzzy')}
                  </p>
                </div>
              ) : (
                <p className="rounded-lg border border-[#85E307]/15 bg-[#85E307]/5 px-3 py-2.5 text-xs leading-relaxed text-[#ECFCCB]/85">
                  {t('customerScreening.clearAdvice', { name: report.query })}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-1">
                <p className="inline-flex items-center gap-1.5 text-[10px] text-white/40">
                  <FileText className="h-3.5 w-3.5" />
                  {t('customerScreening.reportFooter')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReport(null)
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                  className="text-[11px] font-bold text-[#85E307]/90 hover:text-[#85E307]"
                >
                  {t('customerScreening.newSearch')}
                </button>
              </div>
            </div>
          </article>
        ) : null}

        <p className="text-[11px] leading-relaxed text-white/40">{t('customerScreening.attribution')}</p>
      </div>
    </section>
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
    <div className="rounded-lg border border-white/8 bg-black/30 px-3 py-2.5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/45">{label}</p>
      <p
        className={`text-sm break-words ${
          mono ? 'font-mono text-white/70' : highlight ? 'font-semibold text-white' : 'text-white/80'
        }`}
      >
        {value}
      </p>
    </div>
  )
}
