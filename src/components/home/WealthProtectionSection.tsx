import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import goldBarsDuel from '@/assets/home/wealth/gold-bars-duel.png'
import cashStackDuel from '@/assets/home/wealth/cash-stack-duel.png'
import { cn } from '@/lib/utils'

/** Replays enter animation every time the node scrolls into view. */
function useReplayOnView<T extends HTMLElement>(threshold = 0.28) {
  const ref = useRef<T | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting)
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, active }
}

function delayStyle(seconds: number): CSSProperties {
  return { '--reveal-delay': `${seconds}s` } as CSSProperties
}

export function WealthProtectionSection() {
  const { t } = useTranslation()
  const { ref, active } = useReplayOnView<HTMLDivElement>(0.28)

  return (
    <section className="home-section home-section--compact" id="wealth-protection">
      <div className="home-section-inner min-w-0">
        <div
          ref={ref}
          className={cn('wealth-duel', active && 'is-active')}
        >
          {/* Header */}
          <header className="wealth-duel__header">
            <span className="wealth-duel__badge wealth-duel__reveal" style={delayStyle(0.05)}>
              {t('home.wealthProtection.kicker')}
            </span>
            <h2 className="wealth-duel__title wealth-duel__reveal" style={delayStyle(0.12)}>
              <span className="wealth-duel__title-lead">{t('home.wealthProtection.titleLead')}</span>
              <span className="wealth-duel__title-accent">{t('home.wealthProtection.titleAccent')}</span>
            </h2>
            <p className="wealth-duel__subtitle wealth-duel__reveal" style={delayStyle(0.2)}>
              {t('home.wealthProtection.subtitle')}
            </p>
          </header>

          {/* Wave into split stage */}
          <div className="wealth-duel__wave" aria-hidden>
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0 18 C360 18 480 42 720 42 C960 42 1080 18 1440 18 L1440 48 L0 48 Z"
                fill="url(#wealthWaveFill)"
              />
              <defs>
                <linearGradient id="wealthWaveFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3A2416" />
                  <stop offset="50%" stopColor="#2A1C14" />
                  <stop offset="100%" stopColor="#D9C4A8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Duel panels — gold first (start edge / right in RTL) */}
          <div className="wealth-duel__stage">
            <article className="wealth-duel__panel wealth-duel__panel--gold">
              <div className="wealth-duel__visual wealth-duel__reveal" style={delayStyle(0.28)}>
                <img
                  src={goldBarsDuel}
                  alt={t('home.wealthProtection.gold.imageAlt')}
                  className="wealth-duel__img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="wealth-duel__meta wealth-duel__reveal" style={delayStyle(0.38)}>
                <span className="wealth-duel__pill wealth-duel__pill--gold">
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#85E307]" strokeWidth={2.5} aria-hidden />
                  <span>{t('home.wealthProtection.gold.pill')}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50 rtl:rotate-180" aria-hidden />
                </span>
                <p className="wealth-duel__claim wealth-duel__claim--gold">
                  {t('home.wealthProtection.gold.claim')}
                </p>
                <p className="wealth-duel__caption wealth-duel__caption--gold">
                  <span className="wealth-duel__dot wealth-duel__dot--up" aria-hidden />
                  {t('home.wealthProtection.gold.caption')}
                </p>
              </div>
            </article>

            <article className="wealth-duel__panel wealth-duel__panel--cash">
              <div className="wealth-duel__visual wealth-duel__reveal" style={delayStyle(0.32)}>
                <img
                  src={cashStackDuel}
                  alt={t('home.wealthProtection.cash.imageAlt')}
                  className="wealth-duel__img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="wealth-duel__meta wealth-duel__reveal" style={delayStyle(0.42)}>
                <span className="wealth-duel__pill wealth-duel__pill--cash">
                  <ArrowDownRight className="h-3.5 w-3.5 text-[#E57373]" strokeWidth={2.5} aria-hidden />
                  <span>{t('home.wealthProtection.cash.pill')}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-[#E57373]/70 rtl:rotate-180" aria-hidden />
                </span>
                <p className="wealth-duel__claim wealth-duel__claim--cash">
                  {t('home.wealthProtection.cash.claim')}
                </p>
                <p className="wealth-duel__caption wealth-duel__caption--cash">
                  <span className="wealth-duel__dot wealth-duel__dot--down" aria-hidden />
                  {t('home.wealthProtection.cash.caption')}
                </p>
              </div>
            </article>

            <span className="wealth-duel__vs" aria-hidden>
              {t('home.wealthProtection.vs')}
            </span>
          </div>

          {/* CTA */}
          <div className="wealth-duel__footer wealth-duel__reveal" style={delayStyle(0.5)}>
            <Link to="/products" className="wealth-duel__cta">
              <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              {t('home.wealthProtection.cta')}
            </Link>
            <p className="wealth-duel__footnote">{t('home.wealthProtection.footnote')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
