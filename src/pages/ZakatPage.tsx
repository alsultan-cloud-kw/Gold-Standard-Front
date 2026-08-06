import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Scale,
  Sparkles,
} from 'lucide-react'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { useAuth } from '@/contexts/AuthContext'
import { zakatApi } from '@/services/api'
import {
  evaluateZakatLocal,
  formatHijriLabel,
  hijriYearNow,
  type GoldLine,
  type SilverLine,
} from '@/lib/zakatCalc'

type AssetChoice = 'gold' | 'silver' | 'gold_silver' | 'cash' | 'business' | 'complete'
type Hawl = 'yes' | 'no' | 'unsure'
type Purpose = 'savings' | 'investment' | 'business' | 'jewelry' | 'mixed'
type JewelryOpinion = 'include' | 'exclude' | 'ask_scholar'

type Step =
  | 'assets'
  | 'eligibility'
  | 'gold'
  | 'silver'
  | 'cash'
  | 'business'
  | 'debts'
  | 'result'
  | 'learn'

function num(v: string) {
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export default function ZakatPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { data: rates } = useEnrichedPublicRates(20_000)

  const [step, setStep] = useState<Step>('assets')
  const [assetChoice, setAssetChoice] = useState<AssetChoice>('complete')
  const [hawl, setHawl] = useState<Hawl>('unsure')
  const [purpose, setPurpose] = useState<Purpose>('mixed')
  const [jewelryOpinion, setJewelryOpinion] = useState<JewelryOpinion>('ask_scholar')
  const [includeJewelry, setIncludeJewelry] = useState(false)
  const [jewelryValue, setJewelryValue] = useState('')

  const [gold24, setGold24] = useState('')
  const [gold22, setGold22] = useState('')
  const [gold21, setGold21] = useState('')
  const [gold18, setGold18] = useState('')

  const [ag999, setAg999] = useState('')
  const [ag925, setAg925] = useState('')
  const [ag900, setAg900] = useState('')
  const [ag800, setAg800] = useState('')
  const [ag600, setAg600] = useState('')

  const [cash, setCash] = useState('')
  const [business, setBusiness] = useState('')
  const [hasDebts, setHasDebts] = useState(false)
  const [debts, setDebts] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const gold24Buy = useMemo(() => {
    const row = rates?.carats?.find((c) => Number(c.key) === 24 || String(c.key) === '24')
    const v = Number(row?.buyTotal ?? row?.buy ?? 0)
    return Number.isFinite(v) ? v : 0
  }, [rates])

  const silverBuy = useMemo(() => {
    const s = rates?.silver as { buyTotal?: number; buy?: number } | undefined
    const v = Number(s?.buyTotal ?? s?.buy ?? 0)
    return Number.isFinite(v) && v > 0 ? v : null
  }, [rates])

  const showGold = assetChoice === 'gold' || assetChoice === 'gold_silver' || assetChoice === 'complete'
  const showSilver =
    assetChoice === 'silver' || assetChoice === 'gold_silver' || assetChoice === 'complete'
  const showCash = assetChoice === 'cash' || assetChoice === 'complete'
  const showBusiness = assetChoice === 'business' || assetChoice === 'complete'

  const goldLines: GoldLine[] = useMemo(
    () =>
      [
        { carat: '24', weight_grams: num(gold24) },
        { carat: '22', weight_grams: num(gold22) },
        { carat: '21', weight_grams: num(gold21) },
        { carat: '18', weight_grams: num(gold18) },
      ].filter((g) => g.weight_grams > 0),
    [gold24, gold22, gold21, gold18],
  )

  const silverLines: SilverLine[] = useMemo(
    () =>
      [
        { fineness: '999', weight_grams: num(ag999) },
        { fineness: '925', weight_grams: num(ag925) },
        { fineness: '900', weight_grams: num(ag900) },
        { fineness: '800', weight_grams: num(ag800) },
        { fineness: '600', weight_grams: num(ag600) },
      ].filter((s) => s.weight_grams > 0),
    [ag999, ag925, ag900, ag800, ag600],
  )

  const result = useMemo(
    () =>
      evaluateZakatLocal({
        gold_lines: showGold ? goldLines : [],
        silver_lines: showSilver ? silverLines : [],
        cash_kwd: showCash ? num(cash) : 0,
        business_kwd: showBusiness ? num(business) : 0,
        debts_kwd: hasDebts ? num(debts) : 0,
        include_jewelry: includeJewelry && jewelryOpinion === 'include',
        jewelry_value_kwd: num(jewelryValue),
        gold_price_24k_buy_kwd: gold24Buy,
        silver_price_999_buy_kwd: silverBuy,
      }),
    [
      goldLines,
      silverLines,
      cash,
      business,
      debts,
      hasDebts,
      includeJewelry,
      jewelryOpinion,
      jewelryValue,
      gold24Buy,
      silverBuy,
      showGold,
      showSilver,
      showCash,
      showBusiness,
    ],
  )

  const hijriLabel = formatHijriLabel(new Date(), i18n.language?.startsWith('ar') ? 'ar' : 'en')
  const hijriYear = hijriYearNow()

  const visibleSteps = useMemo(() => {
    const s: Step[] = ['assets', 'eligibility']
    if (showGold) s.push('gold')
    if (showSilver) s.push('silver')
    if (showCash) s.push('cash')
    if (showBusiness) s.push('business')
    s.push('debts', 'result', 'learn')
    return s
  }, [showGold, showSilver, showCash, showBusiness])

  useEffect(() => {
    if (!visibleSteps.includes(step)) setStep(visibleSteps[0])
  }, [visibleSteps, step])

  const stepIndex = visibleSteps.indexOf(step)

  const goNext = () => {
    const next = visibleSteps[stepIndex + 1]
    if (next) setStep(next)
  }
  const goBack = () => {
    const prev = visibleSteps[stepIndex - 1]
    if (prev) setStep(prev)
  }

  const importPortfolio = async () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent('/zakat')}`)
      return
    }
    setImporting(true)
    try {
      const res = await zakatApi.portfolioImport()
      const lines = res.gold_lines || []
      const byCarat: Record<string, number> = { '24': 0, '22': 0, '21': 0, '18': 0 }
      for (const line of lines) {
        const c = String(line.carat || '24').replace('K', '')
        const w = Number(line.weight_grams || 0)
        if (byCarat[c] != null && w > 0) byCarat[c] += w
        else if (w > 0) byCarat['24'] += w
      }
      if (byCarat['24']) setGold24(String(byCarat['24']))
      if (byCarat['22']) setGold22(String(byCarat['22']))
      if (byCarat['21']) setGold21(String(byCarat['21']))
      if (byCarat['18']) setGold18(String(byCarat['18']))
      setAssetChoice('complete')
      setStep('gold')
    } catch {
      setSaveMsg(t('zakatPage.importFailed'))
    } finally {
      setImporting(false)
    }
  }

  const saveCalculation = async () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent('/zakat')}`)
      return
    }
    setSaving(true)
    setSaveMsg(null)
    try {
      await zakatApi.createCalculation({
        hijri_year: hijriYear,
        hijri_date_label: hijriLabel,
        hawl_status: hawl,
        asset_purpose: purpose,
        jewelry_opinion: jewelryOpinion,
        include_jewelry: includeJewelry && jewelryOpinion === 'include',
        jewelry_value_kwd: num(jewelryValue),
        gold_lines: showGold ? goldLines : [],
        silver_lines: showSilver ? silverLines : [],
        cash_kwd: showCash ? num(cash) : 0,
        business_kwd: showBusiness ? num(business) : 0,
        debts_kwd: hasDebts ? num(debts) : 0,
        gold_price_24k_buy_kwd: gold24Buy,
        silver_price_999_buy_kwd: silverBuy,
        status: 'estimated',
      })
      setSaveMsg(t('zakatPage.savedOk'))
    } catch {
      setSaveMsg(t('zakatPage.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const choiceClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start text-sm transition ${
      active
        ? 'border-[#85E307] bg-[#ECFCCB]/50 text-[#0B0F19] shadow-sm'
        : 'border-black/10 bg-white text-[#334155] hover:border-black/20'
    }`

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'

  const learnCards = [
    'whatIsZakat',
    'whatIsNisab',
    'whatIsHawl',
    'whichAssets',
    'personalJewelry',
    'investmentGold',
    'silver',
    'cash',
    'business',
    'debts',
    'mistakes',
  ] as const

  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/50 via-[var(--site-bg)] to-[var(--site-bg)]" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3F6F00]">
            {t('zakatPage.kicker')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight text-[#0B0F19] sm:text-4xl">
              {t('zakatPage.title')}
            </h1>
            <span className="rounded-md bg-[#85E307] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B0F19]">
              {t('zakatPage.betaBadge')}
            </span>
          </div>
          <p className="mt-3 max-w-2xl rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm leading-relaxed text-amber-950">
            {t('zakatPage.betaBanner')}
          </p>
          <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[#475569] sm:text-base">
            {t('zakatPage.subtitle')}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs sm:text-sm">
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#0C1512] ring-1 ring-black/5">
              {t('zakatPage.liveGold')}: {gold24Buy ? `${money(gold24Buy)} ${t('zakatPage.kwdPerG')}` : '—'}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#0C1512] ring-1 ring-black/5">
              {t('zakatPage.liveSilver')}:{' '}
              {silverBuy ? `${money(silverBuy)} ${t('zakatPage.kwdPerG')}` : '—'}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#0C1512] ring-1 ring-black/5">
              {t('zakatPage.todayNisab')}: {gold24Buy ? `${money(result.nisab_kwd)} KWD` : '—'}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 font-medium text-[#0C1512] ring-1 ring-black/5">
              {hijriLabel || `Hijri ${hijriYear}`}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void importPortfolio()}
              disabled={importing}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-[#0C1512] hover:bg-[#F4F4F5] disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {t('zakatPage.importHoldings')}
            </button>
            {isAuthenticated ? (
              <Link
                to="/dashboard?tab=zakat"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold text-[#0C1512] hover:bg-[#F4F4F5]"
              >
                <BookOpen className="h-4 w-4" />
                {t('zakatPage.myRecords')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <ol className="space-y-1">
            {visibleSteps.map((s, i) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setStep(s)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${
                    s === step
                      ? 'bg-[#ECFCCB] font-semibold text-[#0B0F19]'
                      : 'text-[#64748B] hover:bg-black/[0.03]'
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs ring-1 ring-black/10">
                    {i + 1}
                  </span>
                  {t(`zakatPage.steps.${s}`)}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
            {t('zakatPage.stepOf', { current: stepIndex + 1, total: visibleSteps.length })}
          </p>

          {step === 'assets' ? (
            <div className="mt-4 space-y-3">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.assetsTitle')}</h2>
              {(
                [
                  ['gold', 'optGold'],
                  ['silver', 'optSilver'],
                  ['gold_silver', 'optGoldSilver'],
                  ['cash', 'optCash'],
                  ['business', 'optBusiness'],
                  ['complete', 'optComplete'],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  className={choiceClass(assetChoice === id)}
                  onClick={() => setAssetChoice(id)}
                >
                  <Scale className="h-4 w-4 shrink-0 text-[#3F6F00]" />
                  {t(`zakatPage.${key}`)}
                </button>
              ))}
            </div>
          ) : null}

          {step === 'eligibility' ? (
            <div className="mt-4 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.hawlTitle')}</h2>
                <div className="mt-3 space-y-2">
                  {(['yes', 'no', 'unsure'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={choiceClass(hawl === v)}
                      onClick={() => setHawl(v)}
                    >
                      {t(`zakatPage.hawl.${v}`)}
                    </button>
                  ))}
                </div>
                {hawl === 'no' ? (
                  <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {t('zakatPage.hawlNotDue')}
                  </p>
                ) : null}
              </div>
              <div>
                <h3 className="font-semibold text-[#0B0F19]">{t('zakatPage.purposeTitle')}</h3>
                <div className="mt-3 space-y-2">
                  {(['savings', 'investment', 'business', 'jewelry', 'mixed'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={choiceClass(purpose === v)}
                      onClick={() => setPurpose(v)}
                    >
                      {t(`zakatPage.purpose.${v}`)}
                    </button>
                  ))}
                </div>
              </div>
              {(purpose === 'jewelry' || purpose === 'mixed') && (
                <div>
                  <h3 className="font-semibold text-[#0B0F19]">{t('zakatPage.jewelryTitle')}</h3>
                  <p className="mt-1 text-sm text-[#64748B]">{t('zakatPage.jewelryHint')}</p>
                  <div className="mt-3 space-y-2">
                    {(['include', 'exclude', 'ask_scholar'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={choiceClass(jewelryOpinion === v)}
                        onClick={() => {
                          setJewelryOpinion(v)
                          setIncludeJewelry(v === 'include')
                        }}
                      >
                        {t(`zakatPage.jewelryOpinion.${v}`)}
                      </button>
                    ))}
                  </div>
                  {jewelryOpinion === 'include' ? (
                    <label className="mt-3 block text-sm">
                      <span className="mb-1 block text-[#475569]">{t('zakatPage.jewelryValue')}</span>
                      <input
                        className={inputClass}
                        inputMode="decimal"
                        value={jewelryValue}
                        onChange={(e) => setJewelryValue(e.target.value)}
                        placeholder="0.000"
                      />
                    </label>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}

          {step === 'gold' ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.goldTitle')}</h2>
              <p className="mt-1 text-sm text-[#64748B]">{t('zakatPage.goldHint')}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['24', gold24, setGold24],
                    ['22', gold22, setGold22],
                    ['21', gold21, setGold21],
                    ['18', gold18, setGold18],
                  ] as const
                ).map(([c, val, set]) => {
                  const pure = num(val) * (({ '24': 1, '22': 22 / 24, '21': 21 / 24, '18': 18 / 24 } as Record<string, number>)[c] || 0)
                  return (
                    <label key={c} className="rounded-xl border border-black/8 p-3">
                      <span className="text-sm font-semibold text-[#0B0F19]">{c}K</span>
                      <input
                        className={`${inputClass} mt-2`}
                        inputMode="decimal"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder="0"
                      />
                      {num(val) > 0 ? (
                        <p className="mt-2 text-xs text-[#3F6F00]">
                          → {pure.toFixed(4)}g {t('zakatPage.pureGold')}
                        </p>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 'silver' ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.silverTitle')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['999', ag999, setAg999],
                    ['925', ag925, setAg925],
                    ['900', ag900, setAg900],
                    ['800', ag800, setAg800],
                    ['600', ag600, setAg600],
                  ] as const
                ).map(([f, val, set]) => (
                  <label key={f} className="rounded-xl border border-black/8 p-3">
                    <span className="text-sm font-semibold text-[#0B0F19]">{f}</span>
                    <input
                      className={`${inputClass} mt-2`}
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {step === 'cash' ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.cashTitle')}</h2>
              <label className="mt-4 block">
                <span className="mb-1 block text-sm text-[#475569]">{t('zakatPage.cashLabel')}</span>
                <input className={inputClass} inputMode="decimal" value={cash} onChange={(e) => setCash(e.target.value)} />
              </label>
            </div>
          ) : null}

          {step === 'business' ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.businessTitle')}</h2>
              <label className="mt-4 block">
                <span className="mb-1 block text-sm text-[#475569]">{t('zakatPage.businessLabel')}</span>
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                />
              </label>
            </div>
          ) : null}

          {step === 'debts' ? (
            <div className="mt-4 space-y-3">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.debtsTitle')}</h2>
              <button type="button" className={choiceClass(!hasDebts)} onClick={() => setHasDebts(false)}>
                {t('zakatPage.debtsNo')}
              </button>
              <button type="button" className={choiceClass(hasDebts)} onClick={() => setHasDebts(true)}>
                {t('zakatPage.debtsYes')}
              </button>
              {hasDebts ? (
                <label className="mt-2 block">
                  <span className="mb-1 block text-sm text-[#475569]">{t('zakatPage.debtsAmount')}</span>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={debts}
                    onChange={(e) => setDebts(e.target.value)}
                  />
                </label>
              ) : null}
            </div>
          ) : null}

          {step === 'result' ? (
            <div className="mt-4">
              <div
                className={`rounded-2xl border px-5 py-6 ${
                  result.above_nisab
                    ? 'border-[#85E307]/60 bg-[#ECFCCB]/35'
                    : 'border-black/10 bg-[#F7F9F5]'
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-[#3F6F00]">
                  <Check className="h-4 w-4" />
                  {result.above_nisab ? t('zakatPage.dueTitle') : t('zakatPage.notDueTitle')}
                </div>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-[#0B0F19]">
                  {money(result.zakat_due_kwd)} <span className="text-lg font-medium">KWD</span>
                </p>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[#64748B]">{t('zakatPage.currentWealth')}</dt>
                    <dd className="font-semibold">{money(result.total_assets_kwd)} KWD</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">{t('zakatPage.nisab')}</dt>
                    <dd className="font-semibold">{money(result.nisab_kwd)} KWD</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">{t('zakatPage.rate')}</dt>
                    <dd className="font-semibold">2.5%</dd>
                  </div>
                  <div>
                    <dt className="text-[#64748B]">{t('zakatPage.pureGoldEq')}</dt>
                    <dd className="font-semibold">{result.pure_gold_equivalent_g.toFixed(4)} g</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-[#0B0F19]">{t('zakatPage.explainTitle')}</h3>
                <ul className="mt-3 space-y-2 text-sm text-[#334155]">
                  {result.breakdown.gold_lines.map((g) => (
                    <li key={`${g.carat}-${g.weight_grams}`} className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                      {g.weight_grams}g × {g.carat}K → {g.pure_g}g → {money(g.value_kwd)} KWD
                    </li>
                  ))}
                  {result.breakdown.silver_lines.map((s) => (
                    <li key={`${s.fineness}-${s.weight_grams}`} className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                      {s.weight_grams}g Ag {s.fineness} → {s.pure_g}g → {money(s.value_kwd)} KWD
                    </li>
                  ))}
                  {result.breakdown.cash_kwd > 0 ? (
                    <li className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                      {t('zakatPage.cashLabel')}: {money(result.breakdown.cash_kwd)} KWD
                    </li>
                  ) : null}
                  {result.breakdown.business_kwd > 0 ? (
                    <li className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                      {t('zakatPage.businessLabel')}: {money(result.breakdown.business_kwd)} KWD
                    </li>
                  ) : null}
                  {result.breakdown.debts_kwd > 0 ? (
                    <li className="rounded-lg bg-[#F7F9F5] px-3 py-2">
                      {t('zakatPage.debtsAmount')}: −{money(result.breakdown.debts_kwd)} KWD
                    </li>
                  ) : null}
                </ul>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-[#64748B]">{t('zakatPage.disclaimer')}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void saveCalculation()}
                  disabled={saving || !gold24Buy}
                  className="ds-btn-accent inline-flex min-h-11 items-center gap-2 px-5 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('zakatPage.saveRecord')}
                </button>
                <Link
                  to="/dashboard?tab=zakat"
                  className="inline-flex min-h-11 items-center rounded-lg border border-black/10 px-4 text-sm font-semibold"
                >
                  {t('zakatPage.myRecords')}
                </Link>
              </div>
              {saveMsg ? <p className="mt-3 text-sm text-[#3F6F00]">{saveMsg}</p> : null}
            </div>
          ) : null}

          {step === 'learn' ? (
            <div className="mt-4">
              <h2 className="text-xl font-semibold text-[#0B0F19]">{t('zakatPage.learnTitle')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {learnCards.map((key) => (
                  <article key={key} className="rounded-xl border border-black/8 bg-[#F7F9F5] p-4">
                    <h3 className="font-semibold text-[#0B0F19]">{t(`zakatPage.learn.${key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                      {t(`zakatPage.learn.${key}.body`)}
                    </p>
                    <p className="mt-3 text-xs font-medium text-[#3F6F00]">{t('zakatPage.learn.source')}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-black/5 pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex <= 0}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-[#475569] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t('zakatPage.back')}
            </button>
            {step !== 'result' && step !== 'learn' ? (
              <button
                type="button"
                onClick={goNext}
                className="ds-btn-accent inline-flex min-h-10 items-center gap-1 px-4"
              >
                {t('zakatPage.next')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            ) : step === 'result' ? (
              <button type="button" onClick={() => setStep('learn')} className="ds-btn-accent inline-flex min-h-10 px-4">
                {t('zakatPage.learnCta')}
              </button>
            ) : (
              <button type="button" onClick={() => setStep('result')} className="ds-btn-accent inline-flex min-h-10 px-4">
                {t('zakatPage.backToResult')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
