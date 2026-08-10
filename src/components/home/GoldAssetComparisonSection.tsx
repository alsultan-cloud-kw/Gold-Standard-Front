import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Coins,
  Crown,
  Globe2,
  Lock,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import {
  ASSET_META,
  COMPARISON_CRITERIA,
  COMPARISON_MAX_SCORE,
  type ComparisonAsset,
} from '@/constants/goldAssetComparison'
import whyGoldHeroUrl from '@/assets/home/why-gold/gold-bar-stones.webp'
import { cn } from '@/lib/utils'

const ASSET_LABEL_KEYS: Record<ComparisonAsset, string> = {
  gold: 'home.goldComparison.assets.gold',
  cash: 'home.goldComparison.assets.cash',
  bitcoin: 'home.goldComparison.assets.bitcoin',
  stocks: 'home.goldComparison.assets.stocks',
  realEstate: 'home.goldComparison.assets.realEstate',
}

/** LTR visual: digital → cash → real estate → stocks → gold (elevated). */
const CARD_ORDER_LTR: ComparisonAsset[] = [
  'bitcoin',
  'cash',
  'realEstate',
  'stocks',
  'gold',
]

/** RTL visual: gold on the inline-start (right) edge. */
const CARD_ORDER_RTL: ComparisonAsset[] = [
  'gold',
  'stocks',
  'realEstate',
  'cash',
  'bitcoin',
]

const FEATURES: {
  id: string
  icon: LucideIcon
  titleKey: string
  bodyKey: string
}[] = [
  {
    id: 'tangible',
    icon: Coins,
    titleKey: 'home.goldComparison.features.tangible.title',
    bodyKey: 'home.goldComparison.features.tangible.body',
  },
  {
    id: 'value',
    icon: Shield,
    titleKey: 'home.goldComparison.features.value.title',
    bodyKey: 'home.goldComparison.features.value.body',
  },
  {
    id: 'liquidity',
    icon: Globe2,
    titleKey: 'home.goldComparison.features.liquidity.title',
    bodyKey: 'home.goldComparison.features.liquidity.body',
  },
  {
    id: 'storage',
    icon: Lock,
    titleKey: 'home.goldComparison.features.storage.title',
    bodyKey: 'home.goldComparison.features.storage.body',
  },
]

function useReplayOnView<T extends HTMLElement>(threshold = 0.22) {
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
        if (entry.isIntersecting) setActive(true)
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, active }
}

function delayStyle(seconds: number): CSSProperties {
  return { '--reveal-delay': `${seconds}s` } as CSSProperties
}

function RatingDots({
  score,
  highlight,
}: {
  score: number
  highlight?: boolean
}) {
  const filled = Math.max(0, Math.min(COMPARISON_MAX_SCORE, Math.round(score)))

  return (
    <div
      className="why-gold__dots"
      role="img"
      aria-label={`${filled} of ${COMPARISON_MAX_SCORE}`}
    >
      {Array.from({ length: COMPARISON_MAX_SCORE }, (_, i) => (
        <span
          key={i}
          className={cn(
            'why-gold__dot',
            i < filled && (highlight ? 'why-gold__dot--gold' : 'why-gold__dot--filled'),
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

function AssetCard({ asset, index }: { asset: ComparisonAsset; index: number }) {
  const { t } = useTranslation()
  const isGold = asset === 'gold'
  const meta = ASSET_META[asset]
  const Icon = meta.icon

  return (
    <article
      className={cn(
        'why-gold__card why-gold__reveal',
        isGold && 'why-gold__card--gold',
      )}
      style={delayStyle(0.18 + index * 0.05)}
    >
      {isGold ? (
        <div className="why-gold__card-banner">
          <Crown className="why-gold__card-banner-icon" strokeWidth={2.25} aria-hidden />
          <span className="why-gold__card-banner-text">
            {t('home.goldComparison.bestLongTerm')}
          </span>
        </div>
      ) : null}

      <div className="why-gold__card-head">
        <span className={cn('why-gold__card-icon', isGold && 'why-gold__card-icon--gold')}>
          <Icon strokeWidth={1.6} aria-hidden />
        </span>
        <h3 className="why-gold__card-title">{t(ASSET_LABEL_KEYS[asset])}</h3>
      </div>

      <ul className="why-gold__criteria">
        {COMPARISON_CRITERIA.map((row) => {
          const CritIcon = row.icon
          const score = row.ratings[asset]
          return (
            <li key={row.id} className="why-gold__criterion">
              <span className="why-gold__criterion-label">{t(row.labelKey)}</span>
              <div className="why-gold__criterion-score">
                <RatingDots score={score} highlight={isGold} />
                {isGold ? (
                  <CritIcon
                    className="why-gold__criterion-glyph"
                    strokeWidth={1.6}
                    aria-hidden
                  />
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {isGold ? (
        <p className="why-gold__card-foot">{t('home.goldComparison.goldFooter')}</p>
      ) : null}
    </article>
  )
}

/**
 * Homepage “Why gold?” — cream/gold comparison matching the marketing reference:
 * split hero, five asset cards with dot ratings, elevated gold card, feature strip.
 */
export function GoldAssetComparisonSection({
  bullionDockRef: _bullionDockRef,
}: {
  bullionDockRef?: RefObject<HTMLDivElement | null>
}) {
  const { t, i18n } = useTranslation()
  const { ref, active } = useReplayOnView<HTMLElement>(0.18)
  const isRtl = i18n.dir() === 'rtl'
  const cards = isRtl ? CARD_ORDER_RTL : CARD_ORDER_LTR

  const titleLead = t('home.goldComparison.titleLead')
  const titleAccent = t('home.goldComparison.titleAccent')

  return (
    <section
      ref={ref}
      id="why-gold"
      className={cn('why-gold home-section home-section--compact', active && 'is-active')}
      aria-labelledby="why-gold-heading"
    >
      <div className="why-gold__inner home-section-inner min-w-0">
        <div className="why-gold__hero">
          <div className="why-gold__copy why-gold__reveal" style={delayStyle(0.06)}>
            <span className="why-gold__diamond" aria-hidden />
            <h2 id="why-gold-heading" className="why-gold__title">
              <span className="why-gold__title-lead">{titleLead}</span>{' '}
              <span
                className="gold-word-3d why-gold__title-accent"
                data-text={titleAccent}
              >
                {titleAccent}
              </span>
              <span className="why-gold__title-mark" aria-hidden>
                {' '}
                {isRtl ? '؟' : '?'}
              </span>
            </h2>
            <p className="why-gold__subtitle">{t('home.goldComparison.heroSubtitle')}</p>
            <p className="why-gold__body">{t('home.goldComparison.heroBody')}</p>
          </div>

          <div className="why-gold__visual why-gold__reveal" style={delayStyle(0.14)}>
            <div className="why-gold__orb" aria-hidden />
            <img
              src={whyGoldHeroUrl}
              alt={t('home.goldComparison.heroAlt')}
              className="why-gold__hero-img"
              width={1400}
              height={933}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>
        </div>

        <div className="why-gold__rail" aria-label={t('home.goldComparison.title')}>
          {cards.map((asset, index) => (
            <AssetCard key={asset} asset={asset} index={index} />
          ))}
        </div>
      </div>

      <div className="why-gold__features">
        <div className="why-gold__features-inner">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.id}
                className="why-gold__feature why-gold__reveal"
                style={delayStyle(0.28 + index * 0.04)}
              >
                <span className="why-gold__feature-icon">
                  <Icon strokeWidth={1.5} aria-hidden />
                </span>
                <div className="why-gold__feature-copy">
                  <h3 className="why-gold__feature-title">{t(feature.titleKey)}</h3>
                  <p className="why-gold__feature-body">{t(feature.bodyKey)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
