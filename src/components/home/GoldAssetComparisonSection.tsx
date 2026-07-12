import { useTranslation } from 'react-i18next'
import type { RefObject } from 'react'
import { Check, Crown, Star } from 'lucide-react'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { HorizontalScrollControls } from '@/components/home/HorizontalScrollControls'
import { useHorizontalScrollRail } from '@/components/home/useHorizontalScrollRail'
import {
  ASSET_META,
  COMPARISON_ASSETS_CARDS,
  COMPARISON_CRITERIA,
  COMPARISON_MAX_SCORE,
  assetOverallScore,
  type ComparisonAsset,
} from '@/constants/goldAssetComparison'
import { BullionEndDock } from '@/components/home/bullion'
import moneyStackUrl from '@/assets/home/money-stack.png'
import clubGoldBarUrl from '@/assets/home/club/club-gold-bar-clear.png'
import { cn } from '@/lib/utils'

const ASSET_LABEL_KEYS: Record<ComparisonAsset, string> = {
  gold: 'home.goldComparison.assets.gold',
  cash: 'home.goldComparison.assets.cash',
  bitcoin: 'home.goldComparison.assets.bitcoin',
  stocks: 'home.goldComparison.assets.stocks',
  realEstate: 'home.goldComparison.assets.realEstate',
}

function ScoreBar({
  score,
  highlight,
}: {
  score: number
  highlight?: boolean
}) {
  const pct = Math.max(0, Math.min(100, (score / COMPARISON_MAX_SCORE) * 100))

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8EBE3]"
      role="img"
      aria-label={`${score} of ${COMPARISON_MAX_SCORE}`}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          highlight
            ? 'bg-gradient-to-r from-[#3F6F00] to-[#6FAE2F]'
            : 'bg-[#94A3B8]',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function StarRow({ score, highlight }: { score: number; highlight?: boolean }) {
  const filled = Math.round(score)
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: COMPARISON_MAX_SCORE }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3 w-3',
            i < filled
              ? highlight
                ? 'fill-[#B8860B] text-[#B8860B]'
                : 'fill-[#94A3B8] text-[#94A3B8]'
              : 'fill-none text-[#E2E8F0]',
          )}
          strokeWidth={1.75}
        />
      ))}
    </div>
  )
}

/**
 * Gold settles into the left/start seat (via scroll flyer).
 * Cash is a large static money-stack illustration — design counterweight + VS.
 */
function GoldVsCashStage({
  bullionDockRef,
}: {
  bullionDockRef?: RefObject<HTMLDivElement | null>
}) {
  const { t } = useTranslation()

  return (
    <div className="relative">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4 lg:gap-6">
        <div className="relative flex min-w-0 flex-col items-center">
          {bullionDockRef ? (
            <BullionEndDock
              slotRef={bullionDockRef}
              className="mb-0 h-[100px] max-w-[120px] sm:h-[200px] sm:max-w-[220px] lg:h-[220px] lg:max-w-[240px]"
            />
          ) : (
            <div className="h-[100px] w-full max-w-[120px] sm:h-[200px] sm:max-w-[220px]" aria-hidden />
          )}
          <p className="mt-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#3F6F00] sm:mt-2 sm:text-[11px] sm:tracking-[0.18em]">
            {t('home.goldComparison.assets.gold')}
          </p>
        </div>

        <div className="relative z-10 flex shrink-0 items-center justify-center">
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full sm:h-14 sm:w-14',
              'border border-black/10 bg-[#0B0F19] text-[10px] font-extrabold tracking-[0.1em] text-[#85E307] sm:text-sm',
              'shadow-[0_12px_40px_-12px_rgba(11,15,25,0.45)]',
            )}
            aria-label={t('home.goldComparison.vs')}
          >
            {t('home.goldComparison.vs')}
          </span>
        </div>

        <div className="relative flex min-w-0 flex-col items-center">
          <div className="relative flex h-[100px] w-full max-w-[120px] items-center justify-center sm:h-[200px] sm:max-w-[220px] lg:h-[220px] lg:max-w-[240px]">
            <img
              src={moneyStackUrl}
              alt={t('home.goldComparison.moneyStackAlt')}
              className={cn(
                'h-[92%] w-auto max-h-full max-w-full object-contain',
                'drop-shadow-[0_18px_32px_rgba(15,23,42,0.18)]',
                'rotate-[-4deg]',
              )}
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
          <p className="mt-1.5 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#B45309] sm:mt-2 sm:text-[11px] sm:tracking-[0.18em]">
            {t('home.goldComparison.assets.cash')}
          </p>
        </div>
      </div>
    </div>
  )
}

function AssetCard({ asset }: { asset: ComparisonAsset }) {
  const { t } = useTranslation()
  const isGold = asset === 'gold'
  const meta = ASSET_META[asset]
  const Icon = meta.icon
  const overall = assetOverallScore(asset)

  return (
    <article
      className={cn(
        'group/card relative flex min-w-[15rem] flex-col rounded-2xl p-4 transition-all duration-300 sm:min-w-0 sm:p-5 lg:p-5 2xl:p-6',
        isGold
          ? cn(
              'z-[1] border border-[#E8D7A6] bg-[#FFFDF6]',
              'shadow-[0_20px_60px_-24px_rgba(180,140,40,0.45)]',
              '2xl:scale-[1.02]',
            )
          : cn(
              'border border-black/8 bg-white shadow-sm',
              'hover:border-black/15 hover:shadow-md',
            ),
      )}
    >
      {isGold ? (
        <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#1A2E1C] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#85E307] sm:mb-4">
          <Crown className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          {t('home.goldComparison.bestChoice')}
        </div>
      ) : (
        <div className="mb-4 h-[1.625rem] sm:mb-4" aria-hidden />
      )}

      <div className="mb-3 flex items-start gap-2.5 sm:mb-4 sm:gap-3">
        <span
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            isGold
              ? 'h-14 w-14 bg-gradient-to-br from-[#F5E6B8] to-[#E8D7A6] p-1.5 shadow-inner'
              : 'h-11 w-11 bg-[#F4F7F1] text-[#64748B]',
          )}
        >
          {isGold ? (
            <img
              src={clubGoldBarUrl}
              alt={t('home.goldComparison.goldBarAlt')}
              className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(120,90,20,0.28)]"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              'type-card-title',
              isGold ? 'text-[#1A2E1C]' : 'text-[#0B0F19]',
            )}
          >
            {t(ASSET_LABEL_KEYS[asset])}
          </h3>
          <p className="type-body-muted mt-1">{t(meta.blurbKey)}</p>
          <div className="mt-2 flex items-center gap-2">
            <StarRow score={overall} highlight={isGold} />
            <span
              className={cn(
                'font-mono text-xs font-semibold tabular-nums',
                isGold ? 'text-[#3F6F00]' : 'text-[#94A3B8]',
              )}
            >
              {overall.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <ul className="mt-auto space-y-2.5 sm:space-y-3.5">
        {COMPARISON_CRITERIA.map((row) => {
          const CritIcon = row.icon
          const score = row.ratings[asset]
          return (
            <li key={row.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-semibold leading-snug text-[#667085]">
                  <CritIcon className="h-3 w-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                  <span className="min-w-0 break-words">{t(row.labelKey)}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[10px] font-bold tabular-nums',
                    isGold ? 'text-[#3F6F00]' : 'text-[#94A3B8]',
                  )}
                >
                  {score}/{COMPARISON_MAX_SCORE}
                </span>
              </div>
              <ScoreBar score={score} highlight={isGold} />
            </li>
          )
        })}
      </ul>

      {isGold ? (
        <div className="mt-5 inline-flex items-center gap-1.5 self-start rounded-full bg-[#ECFCCB] px-3 py-1.5 text-xs font-semibold text-[#3F6F00]">
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          {t('home.goldComparison.recommended')}
        </div>
      ) : (
        <div className="mt-5 h-[2.125rem]" aria-hidden />
      )}
    </article>
  )
}

export function GoldAssetComparisonSection({
  bullionDockRef,
}: {
  bullionDockRef?: RefObject<HTMLDivElement | null>
}) {
  const { t } = useTranslation()
  const { railRef, canScrollBack, canScrollForward, scrollBack, scrollForward } =
    useHorizontalScrollRail(COMPARISON_ASSETS_CARDS.length)

  return (
    <section className="home-section home-section--compact overflow-x-clip bg-[var(--site-bg)]">
      <div className="home-section-inner">
        <div className="section-stack--tight flex flex-col">
        <GoldVsCashStage bullionDockRef={bullionDockRef} />

        <HomeSectionHeader
          kicker={t('home.goldComparison.kicker')}
          title={t('home.goldComparison.title')}
          subtitle={t('home.goldComparison.subtitle')}
          align="center"
        />

        <HorizontalScrollControls
          canScrollBack={canScrollBack}
          canScrollForward={canScrollForward}
          onScrollBack={scrollBack}
          onScrollForward={scrollForward}
          backLabel={t('home.scrollBack')}
          forwardLabel={t('home.scrollForward')}
        />

        {/* Horizontal premium cards — Gold elevated */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div
            ref={railRef}
            className={cn(
              /* Mobile: snap rail. Tablet: 2-up. Small desktop (~1024–1535): 3-up so 1343px isn’t crushed. Wide: 5-up. */
              'flex gap-3 overflow-x-auto pb-2 pt-1',
              'sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0',
              'lg:grid-cols-3 lg:items-stretch lg:gap-4',
              '2xl:grid-cols-5 2xl:gap-4',
              'snap-x snap-mandatory sm:snap-none',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {COMPARISON_ASSETS_CARDS.map((asset) => (
              <div
                key={asset}
                className={cn(
                  'snap-center transition-all duration-300 sm:snap-align-none',
                  asset === 'gold'
                    ? 'peer/gold sm:col-span-2 lg:col-span-1'
                    : 'peer-hover/gold:opacity-55 2xl:peer-hover/gold:scale-[0.98] 2xl:peer-hover/gold:opacity-40',
                )}
              >
                <AssetCard asset={asset} />
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto max-w-xl text-center text-xs leading-relaxed text-[#94A3B8]">
          {t('home.goldComparison.footnote')}
        </p>
        </div>
      </div>
    </section>
  )
}
