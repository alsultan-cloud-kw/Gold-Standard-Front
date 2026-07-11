import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react'
import gsap from 'gsap'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Link2,
  Lock,
  Minus,
  Plus,
  Shield,
  ShoppingBag,
  Tag,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import bullionHorizUrl from '@/assets/home/bullion-horiz.png'
import clubGoldBarUrl from '@/assets/home/club/club-gold-bar-clear.png'
import testimonialsShowcaseUrl from '@/assets/home/club/testimonials-showcase.png'
import { useAuth } from '@/contexts/AuthContext'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { normalizeTrendKey, usePublicRateTrends } from '@/hooks/usePublicRateTrends'
import type { DaralsabaekPublicCarat } from '@/services/api'
import { cn } from '@/lib/utils'

const CLUB_DASHBOARD = '/dashboard?tab=club'

function clubLoginHref() {
  return `/login?next=${encodeURIComponent(CLUB_DASHBOARD)}`
}

/** Showcase order — live sell rates for these karats. */
const CLUB_COMPARE_KARATS = ['24K', '22K', '21K'] as const

const SPARKLINE_BY_KARAT: Record<
  string,
  { line: string; fill: string; tipY: number }
> = {
  '24': {
    line: 'M0 40 C14 38 24 34 38 30 C52 26 62 34 74 20 C88 4 102 16 118 12 C134 8 146 4 160 2',
    fill: 'M0 40 C14 38 24 34 38 30 C52 26 62 34 74 20 C88 4 102 16 118 12 C134 8 146 4 160 2 L160 48 L0 48 Z',
    tipY: 2,
  },
  '22': {
    line: 'M0 34 C16 32 28 26 42 28 C56 30 64 16 80 14 C96 12 104 24 120 18 C136 12 146 8 160 4',
    fill: 'M0 34 C16 32 28 26 42 28 C56 30 64 16 80 14 C96 12 104 24 120 18 C136 12 146 8 160 4 L160 48 L0 48 Z',
    tipY: 4,
  },
  '21': {
    line: 'M0 38 C18 36 30 32 44 28 C58 24 68 30 82 22 C98 12 112 18 128 14 C142 10 150 8 160 6',
    fill: 'M0 38 C18 36 30 32 44 28 C58 24 68 30 82 22 C98 12 112 18 128 14 C142 10 150 8 160 6 L160 48 L0 48 Z',
    tipY: 6,
  },
}

function fmtGramKwd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toFixed(3)
}

/**
 * Homepage showcase only — not real club pricing (varies by club).
 * Live market from API, then a fixed sample member deduction for UI reference.
 */
const SHOWCASE_MEMBER_DEDUCTION_KWD = 0.5

function findCarat(
  carats: DaralsabaekPublicCarat[] | undefined,
  key: string,
): DaralsabaekPublicCarat | undefined {
  const want = normalizeTrendKey(key)
  return carats?.find((c) => normalizeTrendKey(c.key) === want)
}

type ClubLivePriceCard = {
  karat: string
  market: number | null
  member: number | null
  save: number | null
  line: string
  fill: string
  tipY: number
}

function useInViewOnce<T extends HTMLElement>(
  rootMargin = '0px 0px -12% 0px',
): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin, threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])

  return [ref, inView]
}

function AnimatedSparkline({
  line,
  fill,
  tipY = 6,
  active,
  delay = 0,
  className,
}: {
  line: string
  fill: string
  tipY?: number
  active: boolean
  delay?: number
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const fillId = `clubSparkFill-${uid}`
  const lineRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const tipRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const path = lineRef.current
    const area = fillRef.current
    const tip = tipRef.current
    if (!path || !area || !tip) return

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!active || reduceMotion) {
      gsap.set(path, { strokeDasharray: 0, strokeDashoffset: 0, opacity: 1 })
      gsap.set(area, { opacity: 1 })
      gsap.set(tip, { opacity: 1, scale: 1 })
      return
    }

    const length = path.getTotalLength()
    const ctx = gsap.context(() => {
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length, opacity: 1 })
      gsap.set(area, { opacity: 0 })
      gsap.set(tip, { opacity: 0, scale: 0.4, transformOrigin: 'center' })

      const tl = gsap.timeline({ delay })
      tl.to(path, {
        strokeDashoffset: 0,
        duration: 1.35,
        ease: 'power2.out',
      })
        .to(area, { opacity: 1, duration: 0.7, ease: 'power1.out' }, '-=0.85')
        .to(tip, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, '-=0.35')

      gsap.to(tip, {
        scale: 1.35,
        opacity: 0.55,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: delay + 1.4,
      })
    })

    return () => ctx.revert()
  }, [active, delay, line])

  return (
    <svg viewBox="0 0 160 48" className={cn('h-14 w-full', className)} aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(63,111,0,0.28)" />
          <stop offset="100%" stopColor="rgba(63,111,0,0)" />
        </linearGradient>
      </defs>
      <path ref={fillRef} d={fill} fill={`url(#${fillId})`} />
      <path
        ref={lineRef}
        d={line}
        fill="none"
        stroke="#3F6F00"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        ref={tipRef}
        cx="160"
        cy={tipY}
        r="3.25"
        fill="#85E307"
        stroke="#3F6F00"
        strokeWidth="1.25"
      />
    </svg>
  )
}

function ClubPriceCard({
  card,
  index,
  active,
}: {
  card: ClubLivePriceCard
  index: number
  active: boolean
}) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLElement>(null)
  const kwd = t('home.investorsClub.currency')
  const hasSavings = card.save != null && card.save > 0.0005

  useEffect(() => {
    const el = cardRef.current
    if (!el || !active) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, delay: index * 0.12, ease: 'power3.out' },
      )
    })
    return () => ctx.revert()
  }, [active, index])

  return (
    <article
      ref={cardRef}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-black/8 bg-white p-5 shadow-sm',
        'opacity-0 transition-[box-shadow,transform,border-color] duration-300',
        'hover:-translate-y-1 hover:border-[#3F6F00]/25 hover:shadow-[0_18px_40px_-24px_rgba(63,111,0,0.45)]',
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#85E307]/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-[#1A2E1C] sm:text-[1.75rem]">
          {card.karat}
          <span className="text-base font-bold">K</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFCCB] px-2.5 py-1 text-[10px] font-bold text-[#3F6F00]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3F6F00] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3F6F00]" />
          </span>
          {t('home.investorsClub.memberRate')}
        </span>
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-[#94A3B8]">{t('home.investorsClub.marketPrice')}</dt>
          <dd className="font-mono tabular-nums text-[#64748B]">
            {fmtGramKwd(card.market)} <span className="text-[10px]">{kwd}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="font-medium text-[#0B0F19]">{t('home.investorsClub.memberPrice')}</dt>
          <dd className="font-mono font-bold tabular-nums text-[#3F6F00]">
            {fmtGramKwd(card.member)} <span className="text-[10px] font-semibold">{kwd}</span>
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-dashed border-black/10 pt-2.5">
          <dt className="font-semibold text-[#3F6F00]">{t('home.investorsClub.savings')}</dt>
          <dd className="font-mono font-bold tabular-nums text-[#3F6F00]">
            {hasSavings ? (
              <>
                −{fmtGramKwd(card.save)} <span className="text-[10px]">{kwd}</span>
              </>
            ) : (
              <span className="text-[#94A3B8]">—</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-black/5 pt-3">
        <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          <span>{t('home.investorsClub.liveTrend')}</span>
          <span className="font-mono normal-case tracking-normal text-[#3F6F00]">
            +{t('home.investorsClub.live')}
          </span>
        </div>
        <AnimatedSparkline
          line={card.line}
          fill={card.fill}
          tipY={card.tipY}
          active={active}
          delay={0.2 + index * 0.15}
        />
      </div>
    </article>
  )
}

function ClubPriceCompareRail() {
  const { t } = useTranslation()
  const [railRef, inView] = useInViewOnce<HTMLDivElement>()
  const { data, isLoading, isError } = useEnrichedPublicRates(20_000)

  const cards = useMemo((): ClubLivePriceCard[] => {
    return CLUB_COMPARE_KARATS.map((key) => {
      const karatNum = normalizeTrendKey(key)
      const spark = SPARKLINE_BY_KARAT[karatNum] ?? SPARKLINE_BY_KARAT['24']
      const row = findCarat(data?.carats, key)
      const market =
        row?.sellTotal != null && Number.isFinite(Number(row.sellTotal))
          ? Number(row.sellTotal)
          : null
      // Showcase-only sample deduction — does not use clubSellAdd / sellTotalClub.
      const member =
        market != null ? Math.max(0, market - SHOWCASE_MEMBER_DEDUCTION_KWD) : null
      const save = market != null && member != null ? market - member : null
      return {
        karat: karatNum,
        market,
        member,
        save,
        line: spark.line,
        fill: spark.fill,
        tipY: spark.tipY,
      }
    })
  }, [data?.carats])

  const trendEntries = useMemo(
    () =>
      cards.map((c) => ({
        key: c.karat,
        rate: c.member ?? c.market,
      })),
    [cards],
  )
  const entriesKey = useMemo(
    () => trendEntries.map((e) => `${e.key}:${e.rate ?? ''}`).join('|'),
    [trendEntries],
  )
  usePublicRateTrends(Boolean(data?.succeeded), trendEntries, entriesKey)

  const showSkeleton = isLoading && !data?.carats?.length

  return (
    <div className="lg:mb-0" ref={railRef}>
      <div className="section-header flex flex-col items-center gap-1.5 text-center">
        <h3 className="type-section-title text-[#0B0F19] sm:text-2xl">
          {t('home.investorsClub.compareTitle')}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3F6F00] opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3F6F00]" />
          </span>
          {t('home.investorsClub.compareSub')}
        </p>
        <p className="text-[11px] font-medium tracking-wide text-[#94A3B8]">
          {t('home.investorsClub.forIllustrationOnly')}
        </p>
      </div>

      {isError && !data?.carats?.length ? (
        <p className="text-center text-sm text-[#94A3B8]">{t('home.investorsClub.ratesUnavailable')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {showSkeleton
            ? CLUB_COMPARE_KARATS.map((key) => (
                <div
                  key={key}
                  className="h-[17.5rem] animate-pulse rounded-2xl border border-black/8 bg-white/80"
                />
              ))
            : cards.map((card, index) => (
                <ClubPriceCard key={card.karat} card={card} index={index} active={inView} />
              ))}
        </div>
      )}
    </div>
  )
}

function ClubProfileCard() {
  const { t } = useTranslation()

  return (
    <article className="flex h-full flex-col rounded-2xl border border-black/8 bg-white p-5 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] sm:p-6">
      <div className="relative mb-4 flex flex-col items-center text-center">
        <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5E6B8] to-[#C9A227] shadow-inner">
          <Shield className="h-7 w-7 text-[#3F2A00]" strokeWidth={1.5} />
          <Crown className="absolute -top-1 end-0 h-3.5 w-3.5 text-[#3F2A00]" strokeWidth={2.5} />
        </div>
        <p className="text-base font-bold tracking-tight text-[#0B0F19]">
          {t('home.investorsClub.demoClubName')}
        </p>
        <p className="mt-0.5 text-xs text-[#94A3B8]">{t('home.investorsClub.demoClubBy')}</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 border-y border-black/5 py-4">
        {[
          { value: '42', label: t('home.investorsClub.statMembers') },
          { value: '3', label: t('home.investorsClub.statOffers') },
          { value: '2025', label: t('home.investorsClub.statSince') },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 text-center">
            <p className="font-mono text-lg font-bold tabular-nums text-[#3F6F00]">{stat.value}</p>
            <p className="mt-0.5 text-[10px] font-medium leading-tight text-[#94A3B8]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col items-center gap-2">
        <img
          src={testimonialsShowcaseUrl}
          alt=""
          className="pointer-events-none h-[4.5rem] w-auto max-w-full select-none object-contain sm:h-20"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className="rounded-full bg-[#ECFCCB] px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[#3F6F00]">
          +37
        </span>
      </div>

      <div className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-[#FFF8E7] px-3 py-2.5 text-xs font-semibold text-[#8A6A1A]">
        <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {t('home.investorsClub.inviteOnly')}
      </div>
    </article>
  )
}

function OrderReviewShowcase() {
  const { t } = useTranslation()
  const kwd = t('home.investorsClub.currency')

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
      <div className="relative border-b border-black/5 px-5 py-4 sm:px-6">
        <div>
          <h3 className="type-card-title text-[#0B0F19]">
            {t('home.investorsClub.orderReview')}
          </h3>
          <p className="pointer-events-none mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[#3F6F00]">
            <Shield className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            {t('home.investorsClub.autoApplyPrices')}
          </p>
        </div>
        <p className="pointer-events-none mt-2 text-xs font-medium tracking-wide text-[#94A3B8] sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
          {t('home.investorsClub.forIllustrationOnly')}
        </p>
      </div>

      <div className="grid flex-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Product + qty — matches checkout / app order review */}
        <div className="flex flex-col gap-4 border-b border-black/5 p-5 sm:p-6 lg:border-b-0 lg:border-e">
          <div className="flex items-center gap-4 rounded-xl border border-black/8 bg-[#F9F9FA] p-3.5 sm:p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white sm:h-24 sm:w-24">
              <img
                src={bullionHorizUrl}
                alt=""
                className="h-[85%] w-auto max-w-full object-contain"
                draggable={false}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#0B0F19]">{t('home.investorsClub.productName')}</p>
              <p className="mt-0.5 text-sm text-[#64748B]">{t('home.investorsClub.productMeta')}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[#64748B]">{t('home.investorsClub.qty')}</span>
                <div className="inline-flex items-center gap-2 rounded-lg bg-[#EEF1F4] px-1.5 py-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-[#0B0F19]" aria-hidden>
                    <Minus className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-[1rem] text-center font-mono text-sm font-bold tabular-nums">1</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md text-[#0B0F19]" aria-hidden>
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="flex flex-col p-5 sm:p-6">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-[#64748B]">{t('home.investorsClub.marketPrice')}</span>
              <span className="font-mono font-semibold tabular-nums text-[#0B0F19]">
                3,464.000 {kwd}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-[#64748B]">
                {t('home.investorsClub.yourClubPrice')}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#0B0F19]">
                −18.000 {kwd}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 text-[#64748B]">
                {t('home.investorsClub.todayOffer')}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
              </span>
              <span className="font-mono font-semibold tabular-nums text-[#0B0F19]">
                −9.000 {kwd}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 border-t border-dashed border-black/15 pt-3">
              <span className="font-semibold text-[#0B0F19]">{t('home.investorsClub.totalAmount')}</span>
              <span className="font-mono text-lg font-bold tabular-nums text-[#3F6F00]">
                3,437.000 {kwd}
              </span>
            </li>
          </ul>

          <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full bg-[#ECFCCB] px-3 py-1.5 text-xs font-semibold text-[#3F6F00]">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            {t('home.investorsClub.bestPriceApplied')}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-black/5 bg-[#F5F6F4] px-5 py-3 text-xs font-medium text-[#64748B] sm:px-6">
        <Shield className="h-4 w-4 shrink-0 text-[#3F6F00]" strokeWidth={2} />
        {t('home.investorsClub.liveMarketFooter')}
      </div>
    </article>
  )
}

/**
 * Single standout Investors Club section — app-tailored showcase + how it works.
 */
export function InvestorsClubSection() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Club dashboard is a protected route — guests must sign in first.
  const openHref = isAuthenticated ? CLUB_DASHBOARD : clubLoginHref()
  const inviteHref = isAuthenticated ? CLUB_DASHBOARD : clubLoginHref()

  const steps = [
    { icon: UserPlus, titleKey: 'home.investorsClub.step1Title', descKey: 'home.investorsClub.step1Desc' },
    { icon: Crown, titleKey: 'home.investorsClub.step2Title', descKey: 'home.investorsClub.step2Desc' },
    { icon: Tag, titleKey: 'home.investorsClub.step3Title', descKey: 'home.investorsClub.step3Desc' },
    { icon: ShoppingBag, titleKey: 'home.investorsClub.step4Title', descKey: 'home.investorsClub.step4Desc' },
  ]

  const values = [
    { icon: TrendingUp, titleKey: 'home.investorsClub.value1Title', descKey: 'home.investorsClub.value1Desc' },
    { icon: Tag, titleKey: 'home.investorsClub.value2Title', descKey: 'home.investorsClub.value2Desc' },
    { icon: Users, titleKey: 'home.investorsClub.value3Title', descKey: 'home.investorsClub.value3Desc' },
    { icon: Shield, titleKey: 'home.investorsClub.value4Title', descKey: 'home.investorsClub.value4Desc' },
  ]

  return (
    <section className="home-section relative overflow-hidden" id="investors-club">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F1] via-[var(--site-bg)] to-[var(--site-bg)]" />
        <div className="absolute start-1/2 top-0 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#ECFCCB]/35 blur-3xl" />
      </div>

      <div className="home-section-inner section-stack">
        {/* Header */}
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-10">
          <div className="max-w-2xl text-center lg:text-start">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
              {t('home.investorsClub.kicker')}
            </p>
            <h2 className="type-section-title mb-3 text-[#1A2E1C] sm:text-4xl">
              {t('home.investorsClub.title')}
            </h2>
            <p className="mb-3 text-base font-semibold leading-section text-[#3F6F00] sm:text-lg">
              {t('home.investorsClub.tagline')}
            </p>
            <p className="type-lead mx-auto mb-7 max-w-xl text-[#64748B] sm:text-base lg:mx-0">
              {t('home.investorsClub.desc')}
            </p>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
              <Link
                to={openHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full bg-[#1A2E1C] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#243D26] active:scale-[0.98]',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                {isAuthenticated ? t('home.investorsClub.ctaOpen') : t('home.investorsClub.ctaOpenLogin')}
              </Link>
              <Link
                to={inviteHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full border border-[#1A2E1C]/20 bg-white px-6 py-3 text-sm font-semibold text-[#1A2E1C] transition hover:border-[#1A2E1C]/40 active:scale-[0.98]',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Link2 className="h-4 w-4" />
                {isAuthenticated ? t('home.investorsClub.ctaInvite') : t('home.investorsClub.ctaInviteLogin')}
              </Link>
            </div>
            {!isAuthenticated && !authLoading ? (
              <p className="mt-3 text-xs font-medium text-[#94A3B8] lg:text-start text-center">
                {t('home.investorsClub.loginRequiredHint')}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-[170px] shrink-0 sm:w-[200px] lg:w-[220px] xl:w-[250px]">
            <img
              src={clubGoldBarUrl}
              alt=""
              className="w-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        {/* App-tailored showcase */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] lg:gap-5">
          <ClubProfileCard />
          <OrderReviewShowcase />
        </div>

        {/* How it works */}
        <div>
          <h3 className="type-section-title mb-6 text-center text-[#0B0F19] sm:text-2xl">
            {t('home.investorsClub.howTitle')}
          </h3>

          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {steps.map((step, index) => (
              <li key={step.titleKey} className="relative flex">
                <div className="flex flex-1 flex-col rounded-2xl border border-black/8 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFCCB] text-xs font-bold text-[#3F6F00]">
                      {index + 1}
                    </span>
                    <step.icon className="h-5 w-5 text-[#3F6F00]" strokeWidth={1.75} />
                  </div>
                  <p className="mb-1.5 text-sm font-bold text-[#0B0F19]">{t(step.titleKey)}</p>
                  <p className="text-xs leading-relaxed text-[#64748B]">{t(step.descKey)}</p>
                </div>
                {index < steps.length - 1 ? (
                  <span
                    className="absolute -end-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#ECFCCB] text-[#3F6F00] lg:flex"
                    aria-hidden
                  >
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        {/* Price comparison examples — animated live cards */}
        <ClubPriceCompareRail />

        {/* Value strip */}
        <div className="grid gap-px overflow-hidden rounded-2xl border border-black/8 bg-black/5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item) => (
            <div key={item.titleKey} className="flex gap-3 bg-[var(--site-bg)] px-5 py-5 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                <item.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0B0F19]">{t(item.titleKey)}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-[#64748B]">{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
