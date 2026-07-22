import { Clock, ExternalLink, Globe, Hash, Route } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DigitalPassportResponse } from '@/services/api'
import { resolveGsw3RegistryUrl } from '@/lib/gsw3RegistryUrl'

type HistoryRow = DigitalPassportResponse['ownership_history'][number]

function formatJourneyDate(value: string | null | undefined, lang: 'en' | 'ar') {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(lang === 'ar' ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function reasonKey(reason: string | null | undefined): string {
  const r = (reason || 'sale').toLowerCase().replace(/\s+/g, '_')
  const known = [
    'initial_registration',
    'sale',
    'buyback',
    'repurchase',
    'gift',
    'inheritance',
    'correction',
  ]
  return known.includes(r) ? r : 'other'
}

function buildTimeline(
  history: HistoryRow[],
  currentOwner: string,
  ownerSince: string | null,
): HistoryRow[] {
  if (history.length > 0) return history
  if (!currentOwner) return []
  return [
    {
      to_owner_name: currentOwner,
      from_owner_name: null,
      reason: 'initial_registration',
      transferred_at: ownerSince,
    },
  ]
}

type Props = {
  data: DigitalPassportResponse
  lang: 'en' | 'ar'
}

export function OwnershipJourney({ data, lang }: Props) {
  const { t } = useTranslation()
  const rtl = lang === 'ar'
  const chain = data.blockchain
  const registryUrl = resolveGsw3RegistryUrl(chain.gsw3_verify_url, chain.gsw3_bar_id)
  const steps = buildTimeline(
    data.ownership_history ?? [],
    data.ownership.current_owner_name,
    data.ownership.owner_since,
  )

  const networkLabel =
    chain.network === 'polygon-mainnet'
      ? 'Polygon Mainnet'
      : chain.network === 'polygon-amoy'
        ? 'Polygon Amoy (Testnet)'
        : chain.network || null

  return (
    <section
      className="mt-8 overflow-hidden rounded-2xl border border-[#C9B87A]/40 bg-white shadow-lg"
      dir={rtl ? 'rtl' : 'ltr'}
      aria-labelledby="ownership-journey-heading"
    >
      <header className="border-b border-stone-100 bg-gradient-to-r from-lime-50/80 to-[#FFFBF5] px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
            <Route className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <h2 id="ownership-journey-heading" className="text-lg font-bold text-[#0B0F19]">
              {t('passport.journeyTitle')}
            </h2>
            <p className="mt-0.5 text-sm text-stone-600">{t('passport.journeySubtitle')}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 sm:px-6">
        {steps.length === 0 ? (
          <p className="text-center text-sm text-stone-500 py-6">{t('passport.journeyEmpty')}</p>
        ) : (
          <ol className="relative space-y-0">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1
              const reason = reasonKey(step.reason)
              return (
                <li key={`${step.transferred_at}-${step.to_owner_name}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span
                      className="absolute start-[15px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-[#85E307]/60 to-stone-200"
                      aria-hidden
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isLast
                        ? 'bg-[#85E307] text-[#0B0F19] ring-4 ring-lime-100'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#0B0F19]">{step.to_owner_name || '—'}</p>
                      {isLast && (
                        <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                          {t('passport.journeyCurrent')}
                        </span>
                      )}
                    </div>
                    {step.from_owner_name && (
                      <p className="mt-1 text-xs text-stone-500">
                        {t('passport.journeyFromTo', {
                          from: step.from_owner_name,
                          to: step.to_owner_name || '—',
                        })}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <time dateTime={step.transferred_at || undefined}>
                        {formatJourneyDate(step.transferred_at, lang)}
                      </time>
                      <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-medium capitalize text-stone-600">
                        {t(`passport.journeyReason.${reason}`)}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {chain.registered && (
          <div className="mt-6 rounded-xl border border-violet-200/80 bg-violet-50/50 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
              <Globe className="h-4 w-4 shrink-0" />
              {t('passport.journeyBlockchainTitle')}
            </div>
            <p className="mt-1 text-xs text-violet-800/80">{t('passport.journeyBlockchainNote')}</p>
            <dl className="mt-3 space-y-2 text-xs">
              {chain.token_id && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="flex items-center gap-1 text-stone-500">
                    <Hash className="h-3 w-3" /> Token ID
                  </dt>
                  <dd className="font-mono font-semibold text-stone-800">#{chain.token_id}</dd>
                </div>
              )}
              {networkLabel && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-stone-500">{t('passport.journeyNetwork')}</dt>
                  <dd className="font-medium text-stone-800">{networkLabel}</dd>
                </div>
              )}
              {chain.mint_tx_hash && (
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-stone-500">Mint TX</dt>
                  <dd className="max-w-[200px] truncate font-mono text-stone-700 sm:max-w-xs" title={chain.mint_tx_hash}>
                    {chain.mint_tx_hash}
                  </dd>
                </div>
              )}
            </dl>
            {registryUrl && (
              <a
                href={registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:underline"
              >
                {t('passport.blockchainLink')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}

        <p className="mt-5 border-t border-stone-100 pt-4 text-center text-[11px] leading-relaxed text-stone-500">
          {t('passport.journeyAuditNote')}
        </p>
      </div>
    </section>
  )
}
