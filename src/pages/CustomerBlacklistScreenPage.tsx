import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileSearch, ShieldCheck, Database } from 'lucide-react'
import { CustomerBlacklistScreenPanel } from '@/components/compliance/CustomerBlacklistScreenPanel'
import { blacklistScreeningApi } from '@/services/blacklistScreeningApi'

const FEATURE_KEYS = ['search', 'report', 'data'] as const
const FEATURE_ICONS = {
  search: FileSearch,
  report: ShieldCheck,
  data: Database,
} as const

/** GS name screening — public counter tool at /gs-kyc */
export default function CustomerBlacklistScreenPage() {
  const { t } = useTranslation()
  const [totalIndexed, setTotalIndexed] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void blacklistScreeningApi
      .getStats()
      .then((data) => {
        if (!cancelled && data.ok) setTotalIndexed(data.totalNames)
      })
      .catch(() => {
        if (!cancelled) setTotalIndexed(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="storefront-static-page min-h-screen bg-[var(--site-bg)]">
      <section className="border-b border-black/5 bg-[#0B0F19] text-white">
        <div className="page-shell page-section--roomy">
          <p className="page-kicker text-[#85E307]">{t('customerScreening.kicker')}</p>
          <h1 className="store-display-title max-w-3xl">{t('customerScreening.title')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            {t('customerScreening.intro')}
          </p>
        </div>
      </section>

      <section className="page-shell page-section--roomy">
        <div className="mb-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {FEATURE_KEYS.map((key) => {
            const Icon = FEATURE_ICONS[key]
            return (
              <div
                key={key}
                className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-5"
              >
                <Icon className="mb-3 h-5 w-5 text-[#3F6F00]" strokeWidth={1.75} aria-hidden />
                <h2 className="text-sm font-bold text-[#0B0F19]">
                  {t(`customerScreening.features.${key}.title`)}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">
                  {t(`customerScreening.features.${key}.body`)}
                </p>
              </div>
            )
          })}
        </div>

        <CustomerBlacklistScreenPanel totalIndexed={totalIndexed} />
      </section>
    </div>
  )
}
