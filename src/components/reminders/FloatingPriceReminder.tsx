import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { adminApi, apiService, type DaralsabaekPublicRatesResponse } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'
import {
  buildSpotPriceAlertPayloads,
  type PriceReminderBuildErrorCode,
} from '../../lib/priceReminderPayloads'

const BUILD_ERROR_CODES = new Set<PriceReminderBuildErrorCode>(['liveRatesUnavailable', 'invalidDelta', 'noValidRates'])

const LOGIN_REQUIRED = 'LOGIN_REQUIRED'

/**
 * Sticky floating panel to set spot rate reminders on most storefront pages.
 * Hidden on checkout (including order-success on /checkout) and admin routes.
 */
export default function FloatingPriceReminder() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)

  const hidden =
    pathname === '/checkout' ||
    pathname.startsWith('/admin') ||
    pathname === '/join-club' ||
    pathname.startsWith('/join-club/')

  const { data, isLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
    enabled: !hidden,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []

  const [deltaInput, setDeltaInput] = useState('1.000')

  const delta = parseFloat(deltaInput)
  const deltaValid = Number.isFinite(delta) && delta > 0

  const watchSummary = useMemo(() => {
    if (!res?.succeeded) return null
    const goldKeys = carats.map((c) => c.key).filter(Boolean)
    const hasSilver = !!(res.silver?.buyTotal != null || res.silver?.sellTotal != null)
    const hasPlatinum = !!(res.platinum?.buyTotal != null || res.platinum?.sellTotal != null)
    return { goldKeys, hasSilver, hasPlatinum }
  }, [res, carats])

  const createAlertsMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error(LOGIN_REQUIRED)
      }
      const built = buildSpotPriceAlertPayloads({
        res,
        delta,
        deltaValid,
      })
      if (!built.ok) throw new Error(built.errorCode)
      await Promise.all(built.payloads.map((p) => apiService.post('/accounts/price-alerts/', p)))
    },
    onSuccess: () => {
      toast.success(t('priceReminder.toastSaved'))
      setOpen(false)
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        if (err.message === LOGIN_REQUIRED) {
          toast.error(t('priceReminder.toastLoginRequired'))
          return
        }
        const code = err.message as PriceReminderBuildErrorCode
        if (BUILD_ERROR_CODES.has(code)) {
          toast.error(t(`priceReminder.errors.${code}`))
          return
        }
      }
      const message =
        err instanceof Error ? err.message : t('priceReminder.errors.saveFailed')
      toast.error(message)
    },
  })

  if (hidden) return null

  const ratesReady = !!res?.succeeded
  const hasSpotRates =
    ratesReady &&
    (carats.length > 0 ||
      res?.silver?.buyTotal != null ||
      res?.silver?.sellTotal != null ||
      res?.platinum?.buyTotal != null ||
      res?.platinum?.sellTotal != null)

  const inputDisabled = !hasSpotRates || createAlertsMutation.isPending
  const saveDisabled =
    !isAuthenticated || !hasSpotRates || !deltaValid || createAlertsMutation.isPending

  return (
    <div
      className={`fixed bottom-5 end-5 z-[45] w-full pointer-events-auto transition-[max-width] duration-200 ease-out ${
        open ? 'max-w-[min(100vw-2.5rem,32rem)]' : 'max-w-[min(100vw-2rem,20rem)]'
      }`}
      role="complementary"
      aria-label={t('priceReminder.ariaLabel')}
    >
      <div
        className={`border border-gold-500/35 bg-charcoal-950/95 shadow-2xl shadow-black/50 backdrop-blur-md overflow-hidden ${
          open ? 'rounded-2xl' : 'rounded-xl'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center gap-3 text-start hover:bg-gold-500/10 transition-colors ${
            open ? 'px-4 py-3.5 sm:px-5 sm:py-4' : 'px-3 py-2'
          }`}
        >
          <span
            className={`flex shrink-0 items-center justify-center bg-gold-500/15 text-gold-400 ${
              open ? 'h-11 w-11 sm:h-12 sm:w-12 rounded-xl' : 'h-9 w-9 rounded-lg'
            }`}
          >
            <Bell className={open ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-4 w-4'} />
          </span>
          <span className="flex-1 min-w-0">
            <span
              className={`block font-semibold text-gold-100 ${
                open ? 'text-base sm:text-lg' : 'text-sm motion-safe:animate-cart-badge-blink'
              }`}
            >
              {t('priceReminder.title')}
            </span>
            <span
              className={`block text-gold-200/60 truncate mt-0.5 ${
                open ? 'text-xs sm:text-sm' : 'text-[11px] leading-snug'
              }`}
            >
              {isLoading
                ? t('priceReminder.subtitleLoading')
                : hasSpotRates
                  ? t('priceReminder.subtitleReady')
                  : t('priceReminder.subtitleUnavailable')}
            </span>
          </span>
          {open ? (
            <ChevronDown className="h-5 w-5 text-gold-300/70 shrink-0" />
          ) : (
            <ChevronUp className="h-4 w-4 text-gold-300/70 shrink-0" />
          )}
        </button>

        {open && (
          <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-gold-500/15 space-y-4 max-h-[min(75vh,32rem)] overflow-y-auto">
            {!isAuthenticated && (
              <p className="text-sm text-amber-200/90 pt-2">
                <Link to="/login" className="text-gold-400 underline underline-offset-2">
                  {t('priceReminder.loginLink')}
                </Link>{' '}
                {t('priceReminder.loginPrompt')}
              </p>
            )}

            <div className="rounded-lg border border-gold-500/20 bg-charcoal-900/50 px-3 py-3 space-y-2 text-sm text-gold-100/80">
              <p className="text-xs uppercase tracking-wider text-gold-400/90 font-medium">
                {t('priceReminder.watchSummaryTitle')}
              </p>
              {watchSummary && watchSummary.goldKeys.length > 0 ? (
                <p>
                  <span className="text-gold-200/55">{t('priceReminder.watchGoldLabel')} </span>
                  {watchSummary.goldKeys.join(', ')} — {t('priceReminder.watchBuySellBoth')}
                </p>
              ) : null}
              {watchSummary?.hasSilver ? (
                <p>
                  <span className="text-gold-200/55">{t('priceReminder.watchSilverLabel')} </span>
                  {t('priceReminder.watchBuySellBoth')}
                </p>
              ) : null}
              {watchSummary?.hasPlatinum ? (
                <p>
                  <span className="text-gold-200/55">{t('priceReminder.watchPlatinumLabel')} </span>
                  {t('priceReminder.watchBuySellBoth')}
                </p>
              ) : null}
              <p className="text-xs text-gold-200/50 leading-relaxed pt-1">{t('priceReminder.watchHowItWorks')}</p>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-gold-400/90 font-medium">
                {t('priceReminder.deltaLabel')}
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min={0}
                value={deltaInput}
                onChange={(e) => setDeltaInput(e.target.value)}
                disabled={inputDisabled}
                className="mt-2 w-full px-3 py-2.5 sm:py-3 rounded-lg bg-charcoal-900/70 border border-gold-500/30 text-gold-100 text-base tabular-nums"
              />
            </div>

            <button
              type="button"
              onClick={() => createAlertsMutation.mutate()}
              disabled={saveDisabled}
              className="w-full py-3 sm:py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 shadow-lg shadow-amber-900/30"
            >
              {createAlertsMutation.isPending
                ? t('priceReminder.saving')
                : t('priceReminder.saveReminder')}
            </button>

            <p className="text-xs sm:text-sm text-gold-200/55 text-center leading-relaxed">
              <Link to="/dashboard?tab=notifications" className="text-gold-400 hover:underline">
                {t('priceReminder.openNotifications')}
              </Link>
              {' · '}
              <Link to="/prices" className="text-gold-400 hover:underline">
                {t('priceReminder.fullGoldPrices')}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
