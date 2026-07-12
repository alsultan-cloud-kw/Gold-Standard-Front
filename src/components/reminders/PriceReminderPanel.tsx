import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usePriceReminder } from './usePriceReminder'

const INPUT_CLASS =
  'mt-2 w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-base font-medium tabular-nums text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25 disabled:cursor-not-allowed disabled:opacity-60'

type PriceReminderPanelProps = {
  onSaved?: () => void
  className?: string
}

export function PriceReminderPanel({ onSaved, className }: PriceReminderPanelProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    hasSpotRates,
    watchSummary,
    deltaInput,
    setDeltaInput,
    inputDisabled,
    saveDisabled,
    createAlertsMutation,
  } = usePriceReminder()

  return (
    <div className={className}>
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
          {isLoading
            ? t('priceReminder.subtitleLoading')
            : hasSpotRates
              ? t('priceReminder.watchHowItWorks')
              : t('priceReminder.subtitleUnavailable')}
        </p>
      </div>

      <div className="mt-4">
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
        onClick={() =>
          createAlertsMutation.mutate(undefined, {
            onSuccess: () => onSaved?.(),
          })
        }
        disabled={saveDisabled}
        className="gold-button mt-4 w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-none"
      >
        {createAlertsMutation.isPending
          ? t('priceReminder.saving')
          : t('priceReminder.saveReminder')}
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-[#64748B]">
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
  )
}
