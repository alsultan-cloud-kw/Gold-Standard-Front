import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  adminApi,
  type DaralsabaekPublicRatesResponse,
  type KuwaitMarketConfigResponse,
} from '../../services/api'

/** Troy ounce mass in grams (same factor as bullion industry). */
const TROY_OZ_GRAMS = 31.1034768

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

export default function GoldPriceTicker() {
  const { t, i18n } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const isRtl = i18n.dir() === 'rtl'
  const isArabic = i18n.language?.startsWith('ar')

  const { data: goldPrices, isLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
  })
  const { data: kuwaitConfigRaw } = useQuery({
    queryKey: ['kuwaitMarketConfigPublic'],
    queryFn: adminApi.getKuwaitMarketConfig,
    staleTime: 60_000,
    retry: 0,
  })

  const res = goldPrices as DaralsabaekPublicRatesResponse | undefined
  const kuwaitConfig = kuwaitConfigRaw as KuwaitMarketConfigResponse | undefined
  const rawCarats = res?.carats ?? []

  /** Gold karats only — exclude any silver/platinum/palladium-style rows if present in the carats list. */
  const carats = useMemo(() => {
    return rawCarats.filter((c) => {
      const k = String(c.key).toUpperCase().replace(/\s/g, '')
      if (k === 'AG' || k === 'PT' || k === 'PD') return false
      if (k.includes('SILVER') || k.includes('PLATINUM') || k.includes('PALLADIUM')) return false
      return true
    })
  }, [rawCarats])

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  const tickerItems = carats

  const usdToKwdRateFromConfig =
    typeof kuwaitConfig?.usd_to_kwd_rate === 'number' && Number.isFinite(kuwaitConfig.usd_to_kwd_rate) && kuwaitConfig.usd_to_kwd_rate > 0
      ? kuwaitConfig.usd_to_kwd_rate
      : null
  const usdToKwdRateFromRates =
    typeof (res as { usd_to_kwd_rate?: number } | undefined)?.usd_to_kwd_rate === 'number' &&
    Number.isFinite((res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate!) &&
    (res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate! > 0
      ? (res as { usd_to_kwd_rate?: number }).usd_to_kwd_rate!
      : null
  const usdToKwdRate = usdToKwdRateFromConfig ?? usdToKwdRateFromRates
  const toUsdOunce = (raw: number | null): number | null => {
    if (raw == null || !Number.isFinite(raw)) return null
    if (raw >= 1500) return raw
    if (typeof usdToKwdRate === 'number' && usdToKwdRate > 0) return raw / usdToKwdRate
    return null
  }
  const goldOunceUsd = toUsdOunce(numOrNull(res?.goldOuncePrice))
  const goldOunceKwd =
    numOrNull(res?.goldOunce?.sellTotal) ??
    numOrNull(res?.goldOunce?.buyTotal) ??
    (() => {
      const buy24Total = numOrNull(carats.find((c) => String(c.key).toUpperCase().replace(/\s/g, '') === '24K')?.buyTotal)
      return buy24Total != null && Number.isFinite(buy24Total) ? buy24Total * TROY_OZ_GRAMS : null
    })()

  const localeForNums = i18n.language?.startsWith('ar') ? 'ar-KW' : undefined

  const hasOunceRow = goldOunceUsd != null || goldOunceKwd != null

  if (isLoading) {
    return (
      <div className="relative bg-[#070604] border-b border-amber-500/25">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 sm:px-6 lg:px-8 py-3.5 min-h-[3.25rem]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <div className="flex flex-1 gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className="w-12 h-3.5 bg-amber-500/15 rounded animate-pulse" />
                <div className="w-16 h-4 bg-amber-400/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tickerItems.length === 0) {
    return (
      <div className="relative bg-[#070604] border-b border-amber-500/25 text-amber-100/80 text-base">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 sm:px-6 lg:px-8 py-3.5">
          {hasOunceRow ? (
            <div
              className={`flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-amber-100/95 ${
                isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              }`}
            >
              <span className="font-semibold uppercase tracking-wide text-amber-200/85 whitespace-nowrap">
                {t('home.tickerOunceTitle')}
              </span>
              {goldOunceUsd != null ? (
                <span className="tabular-nums whitespace-nowrap" dir="ltr">
                  <span className="text-amber-100/60 uppercase me-1">{t('home.tickerOunceUsd')}</span>
                  <span className={`font-bold text-amber-200 ${isArabic ? 'text-base sm:text-lg' : ''}`}>
                    $
                    {goldOunceUsd.toLocaleString(localeForNums, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </span>
              ) : null}
              {goldOunceKwd != null ? (
                <span
                  className="tabular-nums whitespace-nowrap"
                  dir="ltr"
                  title={t('home.tickerOunceKwdHint')}
                >
                  <span className="text-amber-100/60 uppercase me-1">{t('home.tickerOunceKwd')}</span>
                  <span className={`font-bold text-emerald-300/95 ${isArabic ? 'text-base sm:text-lg' : ''}`}>
                    {goldOunceKwd.toLocaleString(localeForNums, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </span>
              ) : null}
            </div>
          ) : null}
          {hasOunceRow ? (
            <span className="text-amber-400/50 select-none" aria-hidden>
              ·
            </span>
          ) : null}
          <Link to="/prices" className="hover:text-amber-200 underline-offset-2 hover:underline font-semibold shrink-0 text-sm sm:text-base">
            {t('nav.prices')}
          </Link>
        </div>
      </div>
    )
  }

  const renderTrack = (opts: { ariaHidden?: boolean }) => (
    <div
      className="flex items-center gap-0 shrink-0"
      aria-hidden={opts.ariaHidden ? true : undefined}
    >
      {tickerItems.map((c, idx) => {
        const buyTotal = c.buyTotal
        const sellTotal = c.sellTotal
        const spread =
          typeof buyTotal === 'number' &&
          Number.isFinite(buyTotal) &&
          typeof sellTotal === 'number' &&
          Number.isFinite(sellTotal)
            ? sellTotal - buyTotal
            : 0
        return (
          <div key={`${opts.ariaHidden ? 'd' : 's'}-${c.key}-${idx}`} className="flex items-center shrink-0">
            {idx > 0 ? (
              <span className="text-amber-400/70 px-4 sm:px-5 select-none text-sm font-light" aria-hidden>
                ·
              </span>
            ) : null}
            <div
              className="flex items-center gap-x-2 gap-y-0.5 sm:gap-x-2.5 whitespace-nowrap flex-wrap sm:flex-nowrap"
              dir="ltr"
            >
              <span className="text-base sm:text-lg font-semibold text-amber-200/95 tabular-nums">{c.key}</span>
              <span className="text-xs sm:text-sm text-amber-100/55 uppercase tracking-wide">
                {t('home.tickerSell')}
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-300/95 tabular-nums">{fmt(sellTotal)}</span>
              <span className="text-xs sm:text-sm text-amber-100/55 uppercase tracking-wide">
                {t('home.tickerBuy')}
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-300 tabular-nums">{fmt(buyTotal)}</span>
              <span className="text-xs sm:text-sm text-amber-100/50 uppercase tracking-wide">
                {t('common.kwdPerGram')}
              </span>
              <PriceChangeIndicator spread={spread} />
            </div>
          </div>
        )
      })}
    </div>
  )

  const marqueeAnim = isRtl ? 'animate-gold-marquee-rtl' : 'animate-gold-marquee-ltr'

  return (
    <div className="group relative bg-[#070604] border-b border-amber-500/25 text-amber-100">
      <div className="max-w-7xl mx-auto flex items-stretch min-h-[3.25rem]">
        <div className="flex shrink-0 items-center gap-2 px-3 sm:ps-6 lg:ps-8 border-e border-amber-500/20 py-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-sm sm:text-base font-semibold text-amber-200/90 tracking-wide uppercase whitespace-nowrap max-[380px]:sr-only">
            {t('home.metalTickerLabel')}
          </span>
        </div>

        {hasOunceRow ? (
          <div
            className={`flex shrink-0 flex-wrap items-center content-center gap-x-2 sm:gap-x-2.5 gap-y-0.5 px-2 sm:px-3 border-e border-amber-500/20 py-2.5 self-stretch ${
              isArabic ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
            }`}
            title={goldOunceKwd != null ? t('home.tickerOunceKwdHint') : undefined}
          >
            <span className="font-semibold text-amber-200/85 uppercase tracking-wide whitespace-nowrap max-[480px]:sr-only">
              {t('home.tickerOunceTitle')}
            </span>
            {goldOunceUsd != null ? (
              <span className="tabular-nums whitespace-nowrap" dir="ltr">
                <span className="text-amber-100/55 uppercase me-1">{t('home.tickerOunceUsd')}</span>
                <span className={`font-bold text-amber-200 ${isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
                  $
                  {goldOunceUsd.toLocaleString(localeForNums, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            ) : null}
            {goldOunceKwd != null ? (
              <span className="tabular-nums whitespace-nowrap" dir="ltr">
                <span className="text-amber-100/55 uppercase me-1">{t('home.tickerOunceKwd')}</span>
                <span className={`font-bold text-emerald-300/95 ${isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
                  {goldOunceKwd.toLocaleString(localeForNums, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className="min-w-0 flex-1 overflow-hidden py-2.5 flex items-center"
          role="region"
          aria-label={t('home.metalTickerAria')}
        >
          {reducedMotion ? (
            <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 px-3 w-full">
              {renderTrack({})}
            </div>
          ) : (
            <div className="overflow-hidden w-full">
              <div
                className={`flex w-max will-change-transform motion-reduce:animate-none group-hover:[animation-play-state:paused] ${marqueeAnim}`}
              >
                {renderTrack({})}
                {/* Seam between loop copies (e.g. Pt … 24K) — otherwise no gap */}
                <span
                  className="mx-4 sm:mx-5 h-6 w-px shrink-0 self-center bg-amber-400/50 rounded-full"
                  aria-hidden
                />
                {renderTrack({ ariaHidden: true })}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex shrink-0 items-center pe-4 lg:pe-8 border-s border-amber-500/20">
          <Link
            to="/prices"
            className="text-sm font-semibold text-amber-300/90 hover:text-amber-100 whitespace-nowrap transition-colors"
          >
            {t('nav.prices')}
          </Link>
        </div>
      </div>
    </div>
  )
}

function PriceChangeIndicator({ spread }: { spread: number }) {
  if (spread > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-400/95 text-sm tabular-nums">
        <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden />
        +{spread.toFixed(2)}
      </span>
    )
  }
  if (spread < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-400/95 text-sm tabular-nums">
        <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden />
        {spread.toFixed(2)}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-100/45 text-sm tabular-nums">
      <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden />
      0.00
    </span>
  )
}
