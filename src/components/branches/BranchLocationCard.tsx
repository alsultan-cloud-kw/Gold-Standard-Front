import type { ReactNode } from 'react'
import { Clock, MapPin, Navigation, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Branch } from '@/types'
import { branchMapsUrl, branchMarkerLabel, formatBranchAddress } from '@/utils/branchMap'
import { GoogleReviewsBadge } from '@/components/branches/GoogleReviewsBadge'
import { cn } from '@/lib/utils'

type Props = {
  branch: Branch
  selected: boolean
  onSelect: () => void
  formatTime: (raw?: string | null) => string | null
  solo?: boolean
}

function DetailRow({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin
  children: ReactNode
}) {
  return (
    <div className="grid w-full grid-cols-[1.125rem_minmax(0,1fr)] items-start gap-x-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
      <div className="min-w-0 w-full leading-relaxed">{children}</div>
    </div>
  )
}

export function BranchLocationCard({ branch, selected, onSelect, formatTime, solo }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const name = isAr && branch.name_ar ? branch.name_ar : branch.name_en
  const open = formatTime(branch.opening_time)
  const close = formatTime(branch.closing_time)
  const friOpen = formatTime(branch.friday_opening_time)
  const friClose = formatTime(branch.friday_closing_time)
  const addressLine = formatBranchAddress(branch, isAr)
  const typeLabel = t(`branchesPage.type.${branch.branch_type}`, {
    defaultValue: branch.branch_type,
  })
  const showType = !(branch.is_main_branch && branch.branch_type === 'main')

  return (
    <article
      className={cn(
        'relative flex w-full flex-col border-b border-black/6 transition-colors last:border-b-0',
        selected ? 'bg-[#ECFCCB]/40' : 'bg-white hover:bg-[#F9F9FA]',
        solo && 'min-h-full flex-1 border-b-0',
      )}
    >
      {selected ? (
        <span className="absolute inset-y-0 start-0 w-1 bg-[#85E307]" aria-hidden />
      ) : null}

      <div
        className={cn(
          'flex w-full flex-1 flex-col p-4 sm:p-5',
          solo && 'min-h-[min(52vh,380px)] sm:min-h-[min(56vh,440px)] lg:min-h-[min(68vh,560px)]',
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="w-full flex-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 focus-visible:ring-offset-2"
        >
          <div className="flex w-full items-center gap-3">
            <span
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold',
                selected
                  ? 'bg-[#0B0F19] text-[#85E307]'
                  : 'bg-[#F1F5F9] text-[#475569]',
              )}
            >
              {branchMarkerLabel()}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="type-card-title text-[#0B0F19]">{name}</h2>
                {branch.is_main_branch ? (
                  <span className="rounded-full bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                    {t('branchesPage.mainBadge')}
                  </span>
                ) : null}
              </div>
              {showType ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                  {typeLabel}
                </p>
              ) : null}
              {branch.is_main_branch ? (
                <div className="mt-2">
                  <GoogleReviewsBadge compact />
                </div>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              'mt-4 w-full space-y-3.5 rounded-xl border border-black/6 bg-white/70 p-3.5 text-sm text-[#475569] sm:p-4',
              selected && 'border-[#85E307]/20 bg-white/90',
            )}
          >
            <DetailRow icon={MapPin}>
              <span className="block w-full">{addressLine}</span>
            </DetailRow>

            {branch.phone ? (
              <DetailRow icon={Phone}>
                <a
                  href={`tel:${branch.phone.replace(/\s/g, '')}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block w-full font-medium text-[#0B0F19] hover:text-[#3F6F00]"
                  dir="ltr"
                >
                  {branch.phone}
                </a>
              </DetailRow>
            ) : null}

            <DetailRow icon={Clock}>
              <span className="block w-full">
                <span className="block">{t('branchesPage.hoursWeekday', { open, close })}</span>
                {branch.is_open_friday && friOpen && friClose ? (
                  <span className="mt-0.5 block text-[#64748B]">
                    {t('branchesPage.hoursFriday', { open: friOpen, close: friClose })}
                  </span>
                ) : (
                  <span className="mt-0.5 block text-[#64748B]">
                    {t('branchesPage.fridayClosed')}
                  </span>
                )}
              </span>
            </DetailRow>
          </div>
        </button>

        <a
          href={branchMapsUrl(branch)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0B0F19] shadow-sm transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/50"
        >
          <Navigation className="h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
          {t('branchesPage.getDirections')}
        </a>
      </div>
    </article>
  )
}
