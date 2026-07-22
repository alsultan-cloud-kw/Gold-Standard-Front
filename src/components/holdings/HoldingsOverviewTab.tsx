import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowUpRight,
  Layers,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useHoldingsPortfolio } from '@/hooks/useHoldingsPortfolio'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { getDefaultPreviewCarat, numOrNull } from '@/utils/publicStorefrontRates'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { cn } from '@/lib/utils'

function formatKwd(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const prefix = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${prefix}${formatLatinNumber(Math.abs(value), {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`
}

function formatGrams(value: number): string {
  return formatLatinNumber(value, { maximumFractionDigits: 3 })
}

export default function HoldingsOverviewTab() {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language?.startsWith('ar') ? 'ar-KW' : undefined
  const { stats, recentTrades, walletBalance, isLoading, isError } = useHoldingsPortfolio()
  const { data: rates } = useEnrichedPublicRates(30_000)

  const carat24 = getDefaultPreviewCarat(rates)
  const sellPerGram = numOrNull(carat24?.sellTotal)
  const marketValue =
    sellPerGram != null && stats.gramsHeld > 0 ? stats.gramsHeld * sellPerGram : null

  const plPositive = stats.totalPl >= 0

  return (
    <div className="dashboard-panel dashboard-panel--stable space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="dashboard-panel__title">{t('userDashboard.holdingsPanel.title')}</h2>
          <p className="dashboard-panel__subtitle !mb-0">
            {t('userDashboard.holdingsPanel.subtitle')}
          </p>
        </div>
        <Link
          to="/holdings"
          className="dashboard-secondary-btn shrink-0"
        >
          <span>{t('userDashboard.holdingsPanel.openHoldings')}</span>
          <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
        </Link>
      </div>

      {isLoading ? (
        <div className="dashboard-tab-loading">
          <p className="dashboard-empty">{t('userDashboard.holdingsPanel.loading')}</p>
        </div>
      ) : isError ? (
        <div className="dashboard-inset-panel border-red-200 bg-red-50/60 text-sm text-red-800">
          {t('userDashboard.holdingsPanel.loadError')}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="dashboard-inset-panel">
              <div className="mb-2 flex items-center gap-2 text-[#64748B]">
                <Layers className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('userDashboard.holdingsPanel.stats.gramsHeld')}
                </span>
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#0B0F19]">
                {formatGrams(stats.gramsHeld)}
                <span className="ms-1 text-sm font-medium text-[#64748B]">g</span>
              </p>
              <p className="mt-1 text-xs text-[#64748B]">24K</p>
            </div>

            <div className="dashboard-inset-panel">
              <div className="mb-2 flex items-center gap-2 text-[#64748B]">
                <Wallet className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('userDashboard.holdingsPanel.stats.marketValue')}
                </span>
              </div>
              <p className="font-mono text-2xl font-bold tabular-nums text-[#0B0F19]">
                {marketValue != null ? formatKwd(marketValue).replace(/^\+/, '') : '—'}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                {t('userDashboard.holdingsPanel.stats.atSellRate')}
              </p>
            </div>

            <div className="dashboard-inset-panel">
              <div className="mb-2 flex items-center gap-2 text-[#64748B]">
                {plPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" aria-hidden />
                )}
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('userDashboard.holdingsPanel.stats.unrealizedPl')}
                </span>
              </div>
              <p
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  stats.unrealizedPl > 0 && 'text-emerald-700',
                  stats.unrealizedPl < 0 && 'text-red-700',
                  stats.unrealizedPl === 0 && 'text-[#0B0F19]',
                )}
              >
                {formatKwd(stats.unrealizedPl)}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">KWD</p>
            </div>

            <div className="dashboard-inset-panel">
              <div className="mb-2 flex items-center gap-2 text-[#64748B]">
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('userDashboard.holdingsPanel.stats.realizedPl')}
                </span>
              </div>
              <p
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  stats.realizedPl > 0 && 'text-emerald-700',
                  stats.realizedPl < 0 && 'text-red-700',
                  stats.realizedPl === 0 && 'text-[#0B0F19]',
                )}
              >
                {formatKwd(stats.realizedPl)}
              </p>
              <p className="mt-1 text-xs text-[#64748B]">
                {t('userDashboard.holdingsPanel.stats.fromSells', {
                  count: stats.totalSells,
                })}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="dashboard-inset-panel">
              <h3 className="mb-3 text-sm font-bold text-[#0B0F19]">
                {t('userDashboard.holdingsPanel.recentActivity')}
              </h3>
              {recentTrades.length === 0 ? (
                <p className="text-sm text-[#64748B]">
                  {t('userDashboard.holdingsPanel.noActivity')}
                </p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {recentTrades.map((trade) => (
                    <li
                      key={trade.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#0B0F19]">
                          {trade.side === 'buy'
                            ? t('userDashboard.holdingsPanel.activityBuy')
                            : t('userDashboard.holdingsPanel.activitySell')}
                          {' · '}
                          {formatGrams(trade.grams)} g
                        </p>
                        <p className="text-xs text-[#64748B]">
                          {new Date(trade.created_at).toLocaleString(dateLocale, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="font-mono text-sm font-semibold tabular-nums text-[#0B0F19]">
                          {formatKwd(trade.total_kwd).replace(/^\+/, '')} KWD
                        </p>
                        {trade.side === 'sell' && trade.realized_pl_kwd != null ? (
                          <p
                            className={cn(
                              'text-xs font-medium tabular-nums',
                              toNumber(trade.realized_pl_kwd) >= 0
                                ? 'text-emerald-700'
                                : 'text-red-700',
                            )}
                          >
                            {formatKwd(toNumber(trade.realized_pl_kwd))} KWD
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="dashboard-inset-panel flex flex-col justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                  {t('userDashboard.holdingsPanel.walletBalance')}
                </p>
                <p className="mt-2 font-mono text-xl font-bold tabular-nums text-[#0B0F19]">
                  {formatKwd(walletBalance).replace(/^\+/, '')}{' '}
                  <span className="text-sm font-medium text-[#64748B]">KWD</span>
                </p>
                <p className="mt-1 text-xs text-[#64748B]">
                  {t('userDashboard.holdingsPanel.walletHint')}
                </p>
              </div>
              <Link to="/holdings" className="dashboard-primary-btn w-full">
                {t('userDashboard.holdingsPanel.manageHoldings')}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value ?? NaN)
  return Number.isFinite(n) ? n : 0
}
