import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Phone, MapPin, Languages } from 'lucide-react'
import { GS_CONTACT } from '@/constants/contact'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  adminApi,
  type DaralsabaekPublicRatesResponse,
  type DaralsabaekPublicCarat,
} from '../../services/api'
import { cn } from '@/lib/utils'
import type { PriceTrendDir } from '@/components/ProductPriceTrendArrow'

const FLASH_MS = 1800

type MoveDir = 'up' | 'down'
type FlashField = { dir: MoveDir; token: number }

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

function normalizeMetalKey(key: string): string {
  return String(key).toUpperCase().replace(/\s/g, '')
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

function buildTickerItems(res: DaralsabaekPublicRatesResponse | undefined): DaralsabaekPublicCarat[] {
  const items: DaralsabaekPublicCarat[] = [...(res?.carats ?? [])]
  const seen = new Set(items.map((c) => normalizeMetalKey(c.key)))

  const append = (spot: DaralsabaekPublicCarat | null | undefined, fallbackKey: string) => {
    if (!spot) return
    const key = normalizeMetalKey(String(spot.key || fallbackKey))
    if (seen.has(key)) return
    if (spot.buyTotal == null && spot.sellTotal == null) return
    seen.add(key)
    items.push(spot)
  }

  append(res?.silver ?? null, 'AG')
  append(res?.platinum ?? null, 'PT')
  append(res?.palladium ?? null, 'PD')

  return items
}

type TickerPulse = {
  lastDirBuy: Record<string, PriceTrendDir>
  lastDirSell: Record<string, PriceTrendDir>
  flashBuy: Record<string, FlashField | undefined>
  flashSell: Record<string, FlashField | undefined>
}

/** Tracks live rate moves: flash prices briefly, keep arrow on last direction. */
function useTickerPricePulse(items: DaralsabaekPublicCarat[]): TickerPulse {
  const prevRef = useRef<Record<string, { buy: number | null; sell: number | null }>>({})
  const [lastDirBuy, setLastDirBuy] = useState<Record<string, PriceTrendDir>>({})
  const [lastDirSell, setLastDirSell] = useState<Record<string, PriceTrendDir>>({})
  const [flashBuy, setFlashBuy] = useState<Record<string, FlashField | undefined>>({})
  const [flashSell, setFlashSell] = useState<Record<string, FlashField | undefined>>({})
  const timersRef = useRef<number[]>([])

  const snapshotKey = useMemo(
    () =>
      items
        .map((c) => `${normalizeMetalKey(c.key)}:${c.buyTotal ?? ''}:${c.sellTotal ?? ''}`)
        .join('|'),
    [items],
  )

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }

    const scheduleClear = (fn: () => void) => {
      const id = window.setTimeout(fn, FLASH_MS)
      timersRef.current.push(id)
    }

    const nextBuyFlash: Record<string, FlashField | undefined> = {}
    const nextSellFlash: Record<string, FlashField | undefined> = {}
    let buyDirPatch: Record<string, PriceTrendDir> | null = null
    let sellDirPatch: Record<string, PriceTrendDir> | null = null

    for (const c of items) {
      const key = normalizeMetalKey(c.key)
      const buy = numOrNull(c.buyTotal)
      const sell = numOrNull(c.sellTotal)
      const prev = prevRef.current[key]
      const token = Date.now()

      if (prev) {
        if (buy != null && prev.buy != null && buy !== prev.buy) {
          const dir: MoveDir = buy > prev.buy ? 'up' : 'down'
          nextBuyFlash[key] = { dir, token }
          buyDirPatch = { ...(buyDirPatch ?? {}), [key]: dir }
        }
        if (sell != null && prev.sell != null && sell !== prev.sell) {
          const dir: MoveDir = sell > prev.sell ? 'up' : 'down'
          nextSellFlash[key] = { dir, token }
          sellDirPatch = { ...(sellDirPatch ?? {}), [key]: dir }
        }
      }

      prevRef.current[key] = { buy, sell }
    }

    if (buyDirPatch) setLastDirBuy((prev) => ({ ...prev, ...buyDirPatch }))
    if (sellDirPatch) setLastDirSell((prev) => ({ ...prev, ...sellDirPatch }))

    if (Object.keys(nextBuyFlash).length) {
      setFlashBuy((prev) => ({ ...prev, ...nextBuyFlash }))
      scheduleClear(() => {
        setFlashBuy((prev) => {
          const next = { ...prev }
          for (const k of Object.keys(nextBuyFlash)) {
            if (next[k]?.token === nextBuyFlash[k]?.token) delete next[k]
          }
          return next
        })
      })
    }
    if (Object.keys(nextSellFlash).length) {
      setFlashSell((prev) => ({ ...prev, ...nextSellFlash }))
      scheduleClear(() => {
        setFlashSell((prev) => {
          const next = { ...prev }
          for (const k of Object.keys(nextSellFlash)) {
            if (next[k]?.token === nextSellFlash[k]?.token) delete next[k]
          }
          return next
        })
      })
    }

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey])

  return { lastDirBuy, lastDirSell, flashBuy, flashSell }
}

function tickerArrowClass(dir: MoveDir | null, flashing: boolean) {
  if (!dir) return 'text-white/20'
  if (flashing) return dir === 'up' ? 'text-[#85E307]' : 'text-[#FCA5A5]'
  return dir === 'up' ? 'text-[#85E307]/80' : 'text-[#FCA5A5]/80'
}

function TickerDirArrow({
  dir,
  flashing = false,
}: {
  dir: MoveDir | null
  flashing?: boolean
}) {
  if (!dir) return null

  const className = cn(
    'inline-flex shrink-0 transition-colors duration-700 ease-out',
    tickerArrowClass(dir, flashing),
  )

  if (dir === 'up') {
    return (
      <span className={className} aria-hidden>
        <ArrowUp className="h-2.5 w-2.5 stroke-[3]" />
      </span>
    )
  }

  return (
    <span className={className} aria-hidden>
      <ArrowDown className="h-2.5 w-2.5 stroke-[3]" />
    </span>
  )
}

function TickerPriceValue({
  value,
  flash,
  lastDir,
  compact = false,
}: {
  value: string
  flash?: FlashField
  lastDir: PriceTrendDir
  compact?: boolean
}) {
  const flashing = Boolean(flash)
  const activeDir = flash?.dir ?? lastDir

  return (
    <span className="inline-flex items-center gap-0.5">
      <TickerDirArrow dir={activeDir} flashing={flashing} />
      <span
        key={flash ? `flash-${flash.token}` : 'steady'}
        className={cn(
          'font-bold tabular-nums',
          compact ? 'text-xs' : 'text-sm sm:text-base',
          flashing
            ? flash?.dir === 'up'
              ? 'ticker-price-flash-up'
              : 'ticker-price-flash-down'
            : 'text-white/90 transition-colors duration-700 ease-out',
        )}
      >
        {value}
      </span>
    </span>
  )
}

export default function GoldPriceTicker() {
  const { t } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()

  const { data: goldPrices, isLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  })

  const res = goldPrices as DaralsabaekPublicRatesResponse | undefined
  const tickerItems = useMemo(() => buildTickerItems(res), [res])
  const pulse = useTickerPricePulse(tickerItems)

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  const renderTickerTrack = (loopKey: string, compact = false) => (
    <>
      {tickerItems.map((c) => {
        const key = normalizeMetalKey(c.key)
        const buyTotal = c.buyTotal
        const sellTotal = c.sellTotal
        const sellFlash = pulse.flashSell[key]
        const buyFlash = pulse.flashBuy[key]
        const sellDir = pulse.lastDirSell[key] ?? null
        const buyDir = pulse.lastDirBuy[key] ?? null
        return (
          <div
            key={`${loopKey}-${c.key}`}
            className={cn(
              'inline-flex shrink-0 flex-nowrap items-center whitespace-nowrap border-e border-white/10',
              compact ? 'gap-x-2 px-3' : 'gap-x-2.5 px-4 sm:gap-x-3 sm:px-5',
            )}
            dir="ltr"
          >
            <span
              className={cn(
                'font-semibold tabular-nums text-white',
                compact ? 'text-xs' : 'text-sm sm:text-base',
              )}
            >
              {c.key}
            </span>
            <span
              className={cn(
                'uppercase tracking-wide text-white/55',
                compact ? 'text-[9px]' : 'text-[10px] sm:text-xs',
              )}
            >
              {t('home.tickerSell')}
            </span>
            <TickerPriceValue
              value={fmt(sellTotal)}
              flash={sellFlash}
              lastDir={sellDir}
              compact={compact}
            />
            {!compact ? (
              <>
                <span className="text-[10px] uppercase tracking-wide text-white/40 sm:text-xs">
                  {t('home.tickerBuy')}
                </span>
                <TickerPriceValue
                  value={fmt(buyTotal)}
                  flash={buyFlash}
                  lastDir={buyDir}
                />
                <span className="text-[10px] uppercase tracking-wide text-white/35 sm:text-xs">
                  {t('common.kwdPerGram')}
                </span>
              </>
            ) : null}
          </div>
        )
      })}
    </>
  )

  const liveBeacon = (
    <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#85E307]/50" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#85E307]" />
    </span>
  )

  if (isLoading && !res) {
    return (
      <div className="gold-ticker-shell relative border-b border-white/10 bg-[#0B0F19]">
        <div className="page-shell flex min-h-[2.75rem] min-w-0 items-center gap-2 overflow-x-clip py-2 sm:gap-4">
          {liveBeacon}
          <div className="gold-ticker-fade flex min-w-0 flex-1 gap-0 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex shrink-0 items-center gap-2 border-e border-white/10 px-4">
                <div className="h-3.5 w-12 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
              </div>
            ))}
          </div>
          <TickerUtilityCluster />
        </div>
      </div>
    )
  }

  if (tickerItems.length === 0) {
    return (
      <div className="gold-ticker-shell relative border-b border-white/10 bg-[#0B0F19] text-white/70">
        <div className="page-shell flex min-h-[2.75rem] min-w-0 flex-nowrap items-center justify-between gap-x-3 overflow-x-clip py-2">
          <div className="flex min-w-0 flex-1 items-center gap-x-2 sm:gap-x-3">
            {liveBeacon}
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80 sm:text-sm">
              {t('home.metalTickerLabel')}
            </span>
          </div>
          <TickerUtilityCluster />
        </div>
      </div>
    )
  }

  // Marquee math assumes LTR flex + translateX(-50%). Force LTR on the track
  // so Arabic (html[dir=rtl]) still loops — RTL flex reverses children and breaks %.
  const marqueeDuration = Math.max(32, tickerItems.length * 6)

  return (
    <div className="gold-ticker-shell group relative border-b border-white/10 bg-[#0B0F19] text-white/85">
      <div className="page-shell flex min-h-[2.875rem] min-w-0 items-stretch overflow-x-clip sm:min-h-[3.25rem]">
        <div className="gold-ticker-label relative z-10 hidden max-w-[30%] shrink items-center gap-2 overflow-hidden border-e border-white/10 bg-[#0B0F19] px-2 py-3 sm:flex sm:px-3 lg:max-w-none lg:shrink-0 lg:ps-6 lg:pe-3 xl:ps-8">
          {liveBeacon}
          <span className="truncate whitespace-nowrap text-sm font-semibold uppercase tracking-wide text-white/80 sm:text-base">
            {t('home.metalTickerLabel')}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2 py-2 sm:gap-0 sm:py-0">
          <div className="flex shrink-0 items-center gap-1.5 ps-0.5 sm:hidden">
            {liveBeacon}
            <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wide text-[#85E307]">
              {t('home.tickerLiveShort')}
            </span>
          </div>

          <div
            className="gold-ticker-fade gold-ticker-fade--mobile relative flex min-w-0 flex-1 items-center overflow-hidden py-0.5 sm:py-2.5"
            role="region"
            aria-label={t('home.metalTickerAria')}
            dir="ltr"
          >
            {reducedMotion ? (
              <div
                className="gold-ticker-scroll flex w-full min-w-0 flex-nowrap items-center overflow-x-auto overscroll-x-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                dir="ltr"
              >
                <div className="hidden shrink-0 flex-nowrap items-center sm:flex">
                  {renderTickerTrack('static')}
                </div>
                <div className="flex shrink-0 flex-nowrap items-center sm:hidden">
                  {renderTickerTrack('static', true)}
                </div>
              </div>
            ) : (
              <div className="w-full min-w-0 overflow-hidden" dir="ltr">
                <div
                  className="gold-ticker-marquee flex w-max flex-nowrap items-center animate-gold-marquee-ltr group-hover:[animation-play-state:paused]"
                  style={{ animationDuration: `${marqueeDuration}s` }}
                >
                  <div className="hidden shrink-0 flex-nowrap items-center sm:flex">
                    {renderTickerTrack('a')}
                  </div>
                  <div className="hidden shrink-0 flex-nowrap items-center sm:flex" aria-hidden>
                    {renderTickerTrack('b')}
                  </div>
                  <div className="flex shrink-0 flex-nowrap items-center sm:hidden">
                    {renderTickerTrack('a', true)}
                  </div>
                  <div className="flex shrink-0 flex-nowrap items-center sm:hidden" aria-hidden>
                    {renderTickerTrack('b', true)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-10 max-w-[7.5rem] shrink-0 bg-[#0B0F19] sm:max-w-none">
          <TickerUtilityCluster />
        </div>
      </div>
    </div>
  )
}

function TickerUtilityCluster() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const langLabel = isAr ? 'عربي' : 'EN'

  return (
    <div className="flex min-w-0 shrink-0 items-center gap-1 border-s border-white/10 px-1 py-1 sm:gap-3 sm:px-3 sm:py-2 lg:gap-4 lg:pe-6">
      <a
        href={`tel:${GS_CONTACT.phoneTel}`}
        className="hidden items-center gap-1 text-xs text-white/45 transition-colors hover:text-white/80 xl:inline-flex"
        dir="ltr"
      >
        <Phone className="h-3 w-3 shrink-0" />
        <span className="whitespace-nowrap">{GS_CONTACT.phone}</span>
      </a>
      <span className="hidden max-w-[8rem] items-center gap-1 truncate text-xs text-white/45 2xl:inline-flex">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">{t('nav.location')}</span>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-7 max-w-full items-center justify-center gap-0.5 rounded-md border border-white/20 bg-white/[0.08] px-1.5 text-[10px] font-semibold leading-none text-white/90 transition-colors hover:border-[#85E307]/40 hover:bg-white/12 sm:h-auto sm:gap-1 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:text-xs sm:font-normal sm:text-white/45 sm:hover:text-white/80"
            aria-label={t('common.language')}
          >
            <Languages className="h-3 w-3 shrink-0 opacity-90" />
            <span className="max-w-[4.5rem] truncate whitespace-nowrap">{langLabel}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px] border-black/10 bg-white">
          <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer">
            {t('common.english')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')} className="cursor-pointer">
            {t('common.arabic')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
