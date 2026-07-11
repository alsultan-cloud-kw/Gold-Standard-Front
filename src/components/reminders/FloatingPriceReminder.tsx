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
import { cn } from '@/lib/utils'

const BUILD_ERROR_CODES = new Set<PriceReminderBuildErrorCode>([
  'liveRatesUnavailable',
  'invalidDelta',
  'noValidRates',
])

const INPUT_CLASS =
  'mt-2 w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-base font-medium tabular-nums text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25 disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Sticky floating panel to set spot rate reminders — signed-in customers only.
 * Hidden on checkout, admin, and join-club routes.
 */
export default function FloatingPriceReminder() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
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
    enabled: !hidden && isAuthenticated && !authLoading,
  })

  const res = data as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []

  const [deltaInput, setDeltaInput] = useState('1.000')

  const delta = parseFloat(deltaInput)
  const deltaValid = Number.isFinite(delta) && delta > 0

  const watchSummary = useMemo(() => {
    if (!res?.succeeded) return null
    const goldKeys = carats.map((c) => c.key).filter(Boolean)
    return { goldKeys }
  }, [res, carats])

  const createAlertsMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || !user) {
        throw new Error('LOGIN_REQUIRED')
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

  if (hidden || authLoading || !isAuthenticated) return null

  const ratesReady = !!res?.succeeded
  const hasSpotRates = ratesReady && carats.length > 0

  const inputDisabled = !hasSpotRates || createAlertsMutation.isPending
  const saveDisabled = !hasSpotRates || !deltaValid || createAlertsMutation.isPending

  return (
    <div
      className={cn(
        'pointer-events-auto fixed bottom-5 end-5 z-[45] w-full transition-[max-width] duration-200 ease-out',
        open ? 'max-w-[min(100vw-2.5rem,22rem)]' : 'max-w-[min(100vw-2rem,17rem)]',
      )}
      role="complementary"
      aria-label={t('priceReminder.ariaLabel')}
    >
      <div
        className={cn(
          'overflow-hidden border border-black/10 bg-white shadow-[0_8px_32px_rgba(11,15,25,0.12)]',
          open ? 'rounded-2xl' : 'rounded-xl',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-3 text-start transition-colors hover:bg-[#F9F9FA]',
            open ? 'px-4 py-3.5' : 'px-3 py-2.5',
          )}
        >
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]',
              open ? 'h-10 w-10' : 'h-9 w-9 rounded-lg',
            )}
          >
            <Bell className={open ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <span
              className={cn(
                'block font-semibold text-[#0B0F19]',
                open ? 'text-base' : 'text-sm',
              )}
            >
              {t('priceReminder.title')}
            </span>
            <span
              className={cn(
                'mt-0.5 block truncate text-[#64748B]',
                open ? 'text-xs' : 'text-[11px] leading-snug',
              )}
            >
              {isLoading
                ? t('priceReminder.subtitleLoading')
                : hasSpotRates
                  ? t('priceReminder.subtitleReady')
                  : t('priceReminder.subtitleUnavailable')}
            </span>
          </span>

          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden />
          ) : (
            <ChevronUp className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden />
          )}
        </button>

        {open ? (
          <div className="max-h-[min(75vh,28rem)] space-y-4 overflow-y-auto border-t border-black/6 px-4 pb-4 pt-3">
            <div className="space-y-2 rounded-xl border border-[#85E307]/20 bg-[#ECFCCB]/35 px-3.5 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
                {t('priceReminder.watchSummaryTitle')}
              </p>
              {watchSummary && watchSummary.goldKeys.length > 0 ? (
                <p className="text-sm leading-relaxed text-[#0B0F19]">
                  <span className="font-medium text-[#3F6F00]">
                    {t('priceReminder.watchGoldLabel')}{' '}
                  </span>
                  {watchSummary.goldKeys.join(', ')} — {t('priceReminder.watchBuySellBoth')}
                </p>
              ) : null}
              <p className="text-xs leading-relaxed text-[#64748B]">
                {t('priceReminder.watchHowItWorks')}
              </p>
            </div>

            <div>
              <label
                htmlFor="price-reminder-delta"
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]"
              >
                {t('priceReminder.deltaLabel')}
              </label>
              <input
                id="price-reminder-delta"
                type="number"
                inputMode="decimal"
                step="0.001"
                min={0}
                value={deltaInput}
                onChange={(e) => setDeltaInput(e.target.value)}
                disabled={inputDisabled}
                className={INPUT_CLASS}
                dir="ltr"
              />
            </div>

            <button
              type="button"
              onClick={() => createAlertsMutation.mutate()}
              disabled={saveDisabled}
              className="gold-button w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {createAlertsMutation.isPending
                ? t('priceReminder.saving')
                : t('priceReminder.saveReminder')}
            </button>

            <p className="text-center text-xs leading-relaxed text-[#64748B]">
              <Link
                to="/dashboard?tab=notifications"
                className="font-medium text-[#3F6F00] transition-colors hover:text-[#4F8E00]"
              >
                {t('priceReminder.openNotifications')}
              </Link>
              <span className="mx-1.5 text-[#CBD5E1]">·</span>
              <Link
                to="/prices"
                className="font-medium text-[#3F6F00] transition-colors hover:text-[#4F8E00]"
              >
                {t('priceReminder.fullGoldPrices')}
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
