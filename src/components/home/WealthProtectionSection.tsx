import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react'
import goldBarsDuel from '@/assets/home/wealth/gold-bars-duel.webp'
import cashStackDuel from '@/assets/home/wealth/cash-stack-duel.webp'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/**
 * Gold vs cash “value that lasts” duel — layout matched to marketing reference.
 * Motion: one-shot GSAP enter (no reverse on leave — that caused jank on this tall block).
 */
export function WealthProtectionSection() {
  const { t, i18n } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const isRtl = i18n.dir() === 'rtl'

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const headerBits = gsap.utils.toArray<HTMLElement>('[data-wealth-anim="header"]', root)
      const goldVisual = root.querySelector<HTMLElement>('[data-wealth-anim="gold-visual"]')
      const cashVisual = root.querySelector<HTMLElement>('[data-wealth-anim="cash-visual"]')
      const goldMeta = root.querySelector<HTMLElement>('[data-wealth-anim="gold-meta"]')
      const cashMeta = root.querySelector<HTMLElement>('[data-wealth-anim="cash-meta"]')
      const vsInner = root.querySelector<HTMLElement>('[data-wealth-anim="vs"]')
      const footer = root.querySelector<HTMLElement>('[data-wealth-anim="footer"]')

      const pieces = [headerBits, goldVisual, cashVisual, goldMeta, cashMeta, vsInner, footer]
        .flat()
        .filter(Boolean) as HTMLElement[]

      if (reduceMotion) {
        gsap.set(pieces, { clearProps: 'all', autoAlpha: 1, y: 0, scale: 1 })
        return
      }

      gsap.set(headerBits, { autoAlpha: 0, y: 18 })
      gsap.set([goldVisual, cashVisual].filter(Boolean), {
        autoAlpha: 0,
        y: 28,
        scale: 0.92,
        transformOrigin: '50% 60%',
      })
      gsap.set([goldMeta, cashMeta].filter(Boolean), { autoAlpha: 0, y: 16 })
      gsap.set(vsInner, { autoAlpha: 0, scale: 0.72, transformOrigin: '50% 50%' })
      gsap.set(footer, { autoAlpha: 0, y: 14 })

      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        scrollTrigger: {
          trigger: root,
          start: 'top 78%',
          once: true,
          invalidateOnRefresh: true,
        },
      })

      tl.to(headerBits, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
      })
        .to(
          goldVisual,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.85 },
          '-=0.35',
        )
        .to(
          cashVisual,
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.85 },
          '-=0.7',
        )
        .to(
          vsInner,
          { autoAlpha: 1, scale: 1, duration: 0.65, ease: 'back.out(1.4)' },
          '-=0.55',
        )
        .to(
          [goldMeta, cashMeta].filter(Boolean),
          { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06 },
          '-=0.4',
        )
        .to(footer, { autoAlpha: 1, y: 0, duration: 0.55 }, '-=0.25')
    },
    { scope: rootRef, dependencies: [i18n.language] },
  )

  return (
    <section className="home-section home-section--compact" id="wealth-protection">
      <div className="home-section-inner min-w-0">
        <div ref={rootRef} className="wealth-duel">
          <header className="wealth-duel__header">
            <span className="wealth-duel__badge" data-wealth-anim="header">
              {t('home.wealthProtection.kicker')}
            </span>
            <h2 className="wealth-duel__title" data-wealth-anim="header">
              <span className="wealth-duel__title-lead">{t('home.wealthProtection.titleLead')}</span>
              <span className="wealth-duel__title-accent">{t('home.wealthProtection.titleAccent')}</span>
            </h2>
            <p className="wealth-duel__subtitle" data-wealth-anim="header">
              {t('home.wealthProtection.subtitle')}
            </p>
          </header>

          <div className="wealth-duel__wave" aria-hidden>
            <svg viewBox="0 0 1440 72" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0 0 L1440 0 L1440 28 C1180 28 980 68 720 68 C460 68 260 28 0 28 Z"
                fill="#0B0C10"
              />
              <path
                d="M0 28 C260 28 460 68 720 68 C980 68 1180 28 1440 28 L1440 72 L0 72 Z"
                fill="url(#wealthWaveFill)"
              />
              <defs>
                <linearGradient id="wealthWaveFill" x1="0" y1="0" x2="1" y2="0">
                  {isRtl ? (
                    <>
                      <stop offset="0%" stopColor="#D9C4A8" />
                      <stop offset="48%" stopColor="#C9B49A" />
                      <stop offset="52%" stopColor="#2E1C12" />
                      <stop offset="100%" stopColor="#3A2416" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#3A2416" />
                      <stop offset="48%" stopColor="#2E1C12" />
                      <stop offset="52%" stopColor="#C9B49A" />
                      <stop offset="100%" stopColor="#D9C4A8" />
                    </>
                  )}
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="wealth-duel__stage">
            <article className="wealth-duel__panel wealth-duel__panel--gold">
              <div className="wealth-duel__visual" data-wealth-anim="gold-visual">
                <img
                  src={goldBarsDuel}
                  alt={t('home.wealthProtection.gold.imageAlt')}
                  className="wealth-duel__img"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
              <div className="wealth-duel__meta" data-wealth-anim="gold-meta">
                <span className="wealth-duel__pill wealth-duel__pill--gold">
                  <ArrowUpRight className="wealth-duel__pill-icon wealth-duel__pill-icon--up" strokeWidth={2.5} aria-hidden />
                  <span>{t('home.wealthProtection.gold.pill')}</span>
                  <ChevronRight className="wealth-duel__pill-chevron rtl:rotate-180" aria-hidden />
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
              <div className="wealth-duel__visual" data-wealth-anim="cash-visual">
                <img
                  src={cashStackDuel}
                  alt={t('home.wealthProtection.cash.imageAlt')}
                  className="wealth-duel__img"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
              <div className="wealth-duel__meta" data-wealth-anim="cash-meta">
                <span className="wealth-duel__pill wealth-duel__pill--cash">
                  <ArrowDownRight className="wealth-duel__pill-icon wealth-duel__pill-icon--down" strokeWidth={2.5} aria-hidden />
                  <span>{t('home.wealthProtection.cash.pill')}</span>
                  <ChevronRight className="wealth-duel__pill-chevron wealth-duel__pill-chevron--cash rtl:rotate-180" aria-hidden />
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
              <span className="wealth-duel__vs-inner" data-wealth-anim="vs">
                {t('home.wealthProtection.vs')}
              </span>
            </span>

            <div className="wealth-duel__footer" data-wealth-anim="footer">
              <Link to="/products" className="wealth-duel__cta">
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
                {t('home.wealthProtection.cta')}
              </Link>
              <p className="wealth-duel__footnote">{t('home.wealthProtection.footnote')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
