import { useState } from 'react'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '@/lib/utils'
import { PriceReminderPanel } from './PriceReminderPanel'
import { usePriceReminder } from './usePriceReminder'

/**
 * Desktop-only sticky floating panel for spot rate reminders.
 * On small screens use the bell entry in the mobile menu instead.
 */
export default function FloatingPriceReminder() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)

  const hidden =
    pathname === '/checkout' ||
    pathname.startsWith('/admin') ||
    pathname === '/join-club' ||
    pathname.startsWith('/join-club/')

  const { isLoading, hasSpotRates } = usePriceReminder(!hidden)

  if (hidden || authLoading || !isAuthenticated) return null

  return (
    <div
      className={cn(
        'price-reminder-float pointer-events-auto fixed bottom-5 end-5 z-[45] hidden w-full transition-[max-width] duration-200 ease-out lg:block',
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
          <div className="max-h-[min(75vh,28rem)] overflow-y-auto border-t border-black/6 px-4 pb-4 pt-3">
            <PriceReminderPanel onSaved={() => setOpen(false)} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
