import { useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { Star } from 'lucide-react'
import sultanGoldLogo from '@/assets/brand/sultan-gold-logo.png'
import { SULTAN_GOLD_BRAND, type SultanGoldTrustStat } from '@/constants/businessCredentials'
import { BullionEndDock } from '@/components/home/bullion'
import { PRICE_NUMBER_LOCALE } from '@/utils/formatLatinNumber'

type Props = {
  /** Primary settle — heritage logo / kicker block */
  bullionDockRef?: RefObject<HTMLDivElement | null>
  /** Exit — end of trust stats, before live chart */
  bullionTrustEndRef?: RefObject<HTMLDivElement | null>
}

function parseStatValue(raw: string) {
  const plus = raw.includes('+')
  const percent = raw.includes('%')
  const cleaned = raw.replace(/[+,%\s]/g, '')
  const target = Number.parseFloat(cleaned)
  const decimals = cleaned.includes('.') ? (cleaned.split('.')[1]?.length ?? 1) : 0
  return {
    target: Number.isFinite(target) ? target : 0,
    decimals,
    plus,
    percent,
  }
}

function formatAnimated(n: number, decimals: number) {
  if (decimals > 0) {
    return n.toLocaleString(PRICE_NUMBER_LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  return Math.round(n).toLocaleString(PRICE_NUMBER_LOCALE)
}

function AnimatedStatValue({
  stat,
  active,
  delay,
}: {
  stat: SultanGoldTrustStat
  active: boolean
  delay: number
}) {
  const { t } = useTranslation()
  const parsed = parseStatValue(stat.value)
  const [display, setDisplay] = useState(() => formatAnimated(0, parsed.decimals))
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    tweenRef.current?.kill()

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!active || reduceMotion) {
      setDisplay(formatAnimated(parsed.target, parsed.decimals))
      return
    }

    const state = { n: 0 }
    setDisplay(formatAnimated(0, parsed.decimals))
    tweenRef.current = gsap.to(state, {
      n: parsed.target,
      duration: 1.45,
      delay,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplay(formatAnimated(state.n, parsed.decimals))
      },
      onComplete: () => {
        setDisplay(formatAnimated(parsed.target, parsed.decimals))
      },
    })

    return () => {
      tweenRef.current?.kill()
    }
  }, [active, delay, parsed.target, parsed.decimals])

  return (
    <p className="flex items-center justify-center gap-1 text-2xl font-bold tabular-nums text-[#3F6F00] sm:text-3xl">
      <span>{display}</span>
      {parsed.plus ? <span aria-hidden>+</span> : null}
      {parsed.percent ? <span>%</span> : null}
      {'suffixKey' in stat && stat.suffixKey ? (
        <span className="text-xl font-bold sm:text-2xl">{t(stat.suffixKey)}</span>
      ) : null}
      {'showStar' in stat && stat.showStar ? (
        <Star className="h-5 w-5 fill-[#3F6F00] text-[#3F6F00] sm:h-6 sm:w-6" aria-hidden />
      ) : null}
    </p>
  )
}

export function SultanGoldTrustStats({ bullionDockRef, bullionTrustEndRef }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const brandName = isAr ? SULTAN_GOLD_BRAND.nameAr : SULTAN_GOLD_BRAND.nameEn
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView])

  return (
    <section
      ref={sectionRef}
      className="home-section home-section--compact home-section--flush-bottom border-y border-black/5"
    >
      <div className="home-section-inner">
        <div className="mb-5 flex flex-col items-center gap-3 text-center sm:mb-6">
          {bullionDockRef ? (
            <BullionEndDock slotRef={bullionDockRef} className="mb-2" />
          ) : null}
          <img
            src={sultanGoldLogo}
            alt={brandName}
            className="h-12 w-auto object-contain sm:h-14"
            width={120}
            height={56}
            loading="lazy"
            decoding="async"
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3F6F00]">
            {t('home.sultanTrust.kicker')}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-[#64748B] sm:text-base">
            {t('home.sultanTrust.subtitle', { brand: brandName })}
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-6">
          {SULTAN_GOLD_BRAND.trustStats.map((stat, index) => (
            <li key={stat.id} className="min-w-0 text-center">
              <AnimatedStatValue
                stat={stat}
                active={inView}
                delay={index * 0.1}
              />
              <p className="mt-1.5 text-xs font-medium text-[#64748B] sm:text-sm">
                {t(stat.labelKey)}
              </p>
            </li>
          ))}
        </ul>

        {bullionTrustEndRef ? (
          <BullionEndDock
            slotRef={bullionTrustEndRef}
            size="compact"
            className="mt-6 sm:mt-8"
          />
        ) : null}
      </div>
    </section>
  )
}
