import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { GS_APP_STORE_URL, GS_PLAY_STORE_URL } from '@/constants/appStores'
import { cn } from '@/lib/utils'

type Tone = 'onDark' | 'onLight'
type Size = 'md' | 'sm'

type Props = {
  className?: string
  tone?: Tone
  size?: Size
  /** When false, only the two badges render (no heading). */
  showHeading?: boolean
  /**
   * Fill the parent width and stack vertically. A 2/12 footer column is ~127px
   * at the `lg` breakpoint, narrower than the fixed badge row.
   */
  stack?: boolean
}

const badgeBase =
  'store-badge group relative inline-flex min-h-12 min-w-[10.5rem] items-center gap-2.5 rounded-xl px-3.5 py-2 text-start transition-[background-color,border-color,opacity,transform] duration-200 motion-reduce:transition-none'

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.73c.03-2.4 1.96-3.56 2.05-3.61-1.12-1.64-2.86-1.86-3.48-1.89-1.48-.15-2.9.88-3.65.88-.75 0-1.91-.86-3.15-.84-1.62.03-3.12.95-3.95 2.4-1.69 2.93-.43 7.26 1.21 9.64.8 1.16 1.76 2.47 3.02 2.42 1.21-.05 1.67-.79 3.13-.79 1.46 0 1.88.79 3.16.76 1.31-.02 2.13-1.18 2.93-2.35.92-1.35 1.3-2.66 1.32-2.73-.03-.01-2.53-.97-2.56-3.89ZM14.7 6.18c.67-.81 1.12-1.93 1-3.05-.96.04-2.13.64-2.82 1.45-.62.72-1.16 1.87-1.01 2.97 1.07.08 2.16-.54 2.83-1.37Z"
      />
    </svg>
  )
}

function PlayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M4.2 3.15c-.12.08-.2.22-.2.43v16.84c0 .21.08.35.2.43l.07.04 9.38-8.68v-.42L4.27 3.11l-.07.04Zm10.05 9.2 2.13 1.24-9.5 5.5 7.37-6.74Zm2.96-1.72c.58.34.96.78.96 1.37 0 .59-.38 1.03-.96 1.37l-2.13 1.24-2.4-2.2v-.82l2.4-2.2 2.13 1.24ZM6.88 4.91l9.5 5.5-2.13 1.24-7.37-6.74Z"
      />
    </svg>
  )
}

function BadgeCopy({
  eyebrow,
  name,
  soon,
  dense,
}: {
  eyebrow: string
  name: string
  soon?: string
  dense?: boolean
}) {
  return (
    <span className="min-w-0 leading-tight">
      <span className="block text-[10px] font-medium uppercase tracking-[0.08em] opacity-80">
        {eyebrow}
        {soon ? (
          <span className="ms-1.5 font-semibold normal-case tracking-normal opacity-90">
            · {soon}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'mt-0.5 block font-semibold tracking-tight',
          dense ? 'text-[13px]' : 'text-sm',
        )}
      >
        {name}
      </span>
    </span>
  )
}

/**
 * App Store (live) + Play Store (inert until `GS_PLAY_STORE_URL` is set).
 * Badge internals stay LTR so store wordmarks match platform convention in Arabic too.
 */
export function AppStoreBadges({
  className,
  tone = 'onDark',
  size = 'md',
  showHeading = true,
  stack = false,
}: Props) {
  const { t } = useTranslation()
  const headingId = useId()
  const playUrl = GS_PLAY_STORE_URL
  const playReady = Boolean(playUrl)

  const onDark = tone === 'onDark'
  const compact = size === 'sm'

  const liveClass = onDark
    ? 'border border-white/20 bg-black text-white hover:border-white/40 hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0F19] active:scale-[0.98] motion-reduce:active:scale-100'
    : 'border border-zinc-900/80 bg-zinc-950 text-white hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F6F00] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] motion-reduce:active:scale-100'

  const soonClass = onDark
    ? 'cursor-not-allowed border border-white/12 bg-black/55 text-white/70'
    : 'cursor-not-allowed border border-zinc-300 bg-zinc-800/90 text-white/75'

  const iconClass = cn('shrink-0', compact ? 'h-6 w-6' : 'h-7 w-7', stack && 'h-5 w-5')
  const badgeClass = cn(
    badgeBase,
    compact && 'min-h-11 min-w-[9.75rem] px-3',
    stack && 'w-full min-w-0 gap-2 px-2.5',
  )
  const headingClass = onDark
    ? 'text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]'
    : 'text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]'

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {showHeading ? (
        <p className={headingClass} id={headingId}>
          {t('footer.getTheApp')}
        </p>
      ) : null}
      <div
        className={cn('flex flex-wrap gap-2.5', compact && 'gap-2', stack && 'flex-col flex-nowrap')}
        role="group"
        aria-labelledby={showHeading ? headingId : undefined}
        aria-label={showHeading ? undefined : t('footer.getTheApp')}
      >
        <a
          href={GS_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          className={cn(badgeClass, liveClass)}
          aria-label={t('footer.appStoreAria')}
        >
          <AppleMark className={iconClass} />
          <BadgeCopy
            eyebrow={t('footer.appStoreEyebrow')}
            name={t('footer.appStoreName')}
            dense={stack}
          />
        </a>

        {playReady && playUrl ? (
          <a
            href={playUrl}
            target="_blank"
            rel="noopener noreferrer"
            dir="ltr"
            className={cn(badgeClass, liveClass)}
            aria-label={t('footer.playStoreAria')}
          >
            <PlayMark className={iconClass} />
            <BadgeCopy
              eyebrow={t('footer.playStoreEyebrow')}
              name={t('footer.playStoreName')}
              dense={stack}
            />
          </a>
        ) : (
          <button
            type="button"
            dir="ltr"
            disabled
            className={cn(badgeClass, soonClass)}
            aria-label={t('footer.playStoreSoonAria')}
            title={t('footer.appComingSoon')}
          >
            <PlayMark className={iconClass} />
            <BadgeCopy
              eyebrow={t('footer.playStoreEyebrow')}
              name={t('footer.playStoreName')}
              soon={t('footer.appComingSoon')}
              dense={stack}
            />
          </button>
        )}
      </div>
    </div>
  )
}
