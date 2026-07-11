import { useTranslation } from 'react-i18next'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

type Variant = 'page' | 'fullscreen'

type Props = {
  message?: string
  /** Hide the bottom trust strip (rare; default shown). */
  showTrust?: boolean
  variant?: Variant
  className?: string
}

/**
 * Branded Gold Standard loading screen — used for boot, auth gates, and page loads.
 * Matches the storefront splash: mark + kicker + message + dots + trust strip.
 */
export function AppLoadingScreen({
  message,
  showTrust = true,
  variant = 'page',
  className,
}: Props) {
  const { t } = useTranslation()
  const isFullscreen = variant === 'fullscreen'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'gs-app-loader',
        isFullscreen && 'gs-app-loader--fullscreen',
        className,
      )}
    >
      <div className="gs-app-loader__ambient" aria-hidden />

      <div className="gs-app-loader__stage">
        <div className="gs-app-loader__mark gs-app-loader__fade gs-app-loader__fade--1">
          <span className="gs-app-loader__halo" aria-hidden />
          <span className="gs-app-loader__ring" aria-hidden />
          <img
            src={logo}
            alt=""
            aria-hidden
            className="gs-app-loader__logo relative z-[1] h-9 w-auto object-contain sm:h-10"
            width={120}
            height={40}
          />
        </div>

        <p className="gs-app-loader__brand gs-app-loader__fade gs-app-loader__fade--2">
          {t('common.loadingKicker')}
        </p>

        <p className="gs-app-loader__message gs-app-loader__fade gs-app-loader__fade--3">
          {message ?? t('common.loading')}
        </p>

        <div
          className="gs-app-loader__dots gs-app-loader__fade gs-app-loader__fade--4"
          aria-hidden
        >
          <span />
          <span />
          <span />
        </div>
      </div>

      {showTrust ? (
        <p className="gs-app-loader__trust gs-app-loader__fade gs-app-loader__fade--5">
          {t('common.loadingTrust.moci')}
          <span className="mx-2 opacity-30" aria-hidden>
            ·
          </span>
          {t('common.loadingTrust.insured')}
          <span className="mx-2 opacity-30" aria-hidden>
            ·
          </span>
          {t('common.loadingTrust.licensed')}
        </p>
      ) : null}
    </div>
  )
}
