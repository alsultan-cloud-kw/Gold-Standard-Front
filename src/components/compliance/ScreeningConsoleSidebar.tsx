import {
  BarChart3,
  Eye,
  FileText,
  Shield,
  Upload,
  UserSearch,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ScreeningConsoleTab } from '@/lib/screeningConsoleStorage'

type Props = {
  active: ScreeningConsoleTab
  onChange: (tab: ScreeningConsoleTab) => void
  totalIndexed: number | null
  onNewVerification: () => void
}

const NAV: { id: ScreeningConsoleTab; icon: typeof UserSearch }[] = [
  { id: 'overview', icon: BarChart3 },
  { id: 'screening', icon: UserSearch },
  { id: 'history', icon: FileText },
  { id: 'watchlist', icon: Eye },
  { id: 'reporting', icon: Upload },
]

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function ScreeningConsoleSidebar({
  active,
  onChange,
  totalIndexed,
  onNewVerification,
}: Props) {
  const { t } = useTranslation()

  return (
    <aside className="flex h-full flex-col border-black/[0.08] bg-white lg:border-e">
      <div className="border-b border-black/[0.06] px-4 py-5 sm:px-5">
        <p className="text-lg font-bold tracking-tight text-[#3F6F00] sm:text-xl">
          {t('customerScreening.console.brand')}
        </p>
        <p className="mt-1 text-xs text-[#64748B]">{t('customerScreening.console.brandSub')}</p>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-[#F7F8F5] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#3F6F00]">
              {t('customerScreening.console.dbActive')}
            </p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-[#64748B]">
              {totalIndexed != null && totalIndexed > 0
                ? t('customerScreening.console.recordsSynced', {
                    size: formatCount(totalIndexed),
                  })
                : t('customerScreening.console.recordsPending')}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#85E307] text-[#0B0F19]">
            <Shield className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
        </div>

        <button
          type="button"
          onClick={onNewVerification}
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#85E307] px-4 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9af01a] active:scale-[0.98]"
        >
          {t('customerScreening.console.newVerification')}
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-6" aria-label={t('customerScreening.console.navAria')}>
        {NAV.map(({ id, icon: Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition lg:w-full ${
                isActive
                  ? 'bg-[#ECFCCB] text-[#0B0F19] ring-1 ring-[#85E307]/40'
                  : 'text-[#64748B] hover:bg-[#F4F5F1] hover:text-[#0B0F19]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="whitespace-nowrap">{t(`customerScreening.console.nav.${id}`)}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto hidden border-t border-black/[0.06] px-5 py-4 text-xs text-[#94A3B8] lg:block">
        {t('customerScreening.console.sidebarFooter')}
      </div>
    </aside>
  )
}
