import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { DaralsabaekPublicRatesResponse } from '@/services/api'
import { pricingApi, toFiniteNumber } from '@/services/pricingApi'
import { caratGramTotals, normalizeCaratKey } from '@/utils/publicStorefrontRates'
import { dayChangeFromPercent } from '@/utils/dayChangeFallback'
import { formatKwd } from '@/utils/productPrice'
import { cn } from '@/lib/utils'

type Props = {
  rates: DaralsabaekPublicRatesResponse
  className?: string
}

function karatLabel(key: string) {
  return normalizeCaratKey(key).replace(/K$/i, '')
}

function isFeaturedKarat(key: string) {
  return normalizeCaratKey(key).startsWith('24')
}

/**
 * Compact karat board for the homepage chart rail.
 * Same KWD customer reference as /prices karat cards:
 * buy = you pay (shop sellTotal) · sell = you receive (shop buyTotal).
 * Columns: karat · buy · sell · % only (no price gaps, no absolute change).
 */
export function HomeKaratRatesTable({ rates, className }: Props) {
  const { t } = useTranslation()
  const carats = rates.carats ?? []

  const { data: goldCurrentSnap } = useQuery({
    queryKey: ['pricingCurrent', 'gold', 'home-karat-table'],
    queryFn: () => pricingApi.getCurrent('gold'),
    staleTime: 25_000,
    retry: 1,
    enabled: carats.length > 0,
  })

  const goldChp = toFiniteNumber(goldCurrentSnap?.chp)

  const rows = useMemo(
    () =>
      carats.map((c) => {
        const { buyTotal: buyForWeight, sellTotal: sellForWeight } = caratGramTotals(c, 1)
        // Match PricesPage karat cards / CustomerGoldPricePair.
        const buyGoldTotal = sellForWeight
        const sellGoldTotal = buyForWeight
        const day = dayChangeFromPercent(c, goldChp)
        const pct =
          day.changeTodayPercent != null && Number.isFinite(day.changeTodayPercent)
            ? Number(day.changeTodayPercent)
            : null
        return {
          key: c.key,
          karat: karatLabel(c.key),
          buyGoldTotal,
          sellGoldTotal,
          pct,
          featured: isFeaturedKarat(c.key),
        }
      }),
    [carats, goldChp],
  )

  if (rows.length === 0) return null

  return (
    <div className={cn('home-karat-table', className)}>
      <div className="home-karat-table__head">
        <p className="home-karat-table__eyebrow">{t('home.karatTable.eyebrow')}</p>
        <h3 className="home-karat-table__title">{t('home.karatTable.title')}</h3>
        <p className="home-karat-table__unit">{t('pricesPage.kwdPerGramUnit')}</p>
      </div>

      <div className="home-karat-table__scroll">
        <table className="home-karat-table__grid">
          <thead>
            <tr>
              <th scope="col">{t('home.karatTable.colKarat')}</th>
              <th scope="col">{t('pricesPage.priceToBuyGold')}</th>
              <th scope="col">{t('pricesPage.priceToSellGold')}</th>
              <th scope="col">{t('home.karatTable.colPct')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dir: 'up' | 'down' | 'flat' =
                row.pct == null ? 'flat' : row.pct > 0 ? 'up' : row.pct < 0 ? 'down' : 'flat'
              const pctLabel =
                row.pct == null
                  ? '—'
                  : `${row.pct > 0 ? '+' : row.pct < 0 ? '−' : ''}${Math.abs(row.pct).toFixed(2)}%`

              return (
                <tr
                  key={row.key}
                  className={cn(row.featured && 'home-karat-table__row--featured')}
                >
                  <th scope="row">
                    <span className="home-karat-table__karat" dir="ltr">
                      <span className="home-karat-table__dot" aria-hidden />
                      {t('home.karatTable.karatRow', { karat: row.karat })}
                    </span>
                  </th>
                  <td className="home-karat-table__buy" dir="ltr">
                    {formatKwd(row.buyGoldTotal)}
                  </td>
                  <td className="home-karat-table__sell" dir="ltr">
                    {formatKwd(row.sellGoldTotal)}
                  </td>
                  <td>
                    <span
                      className={cn(
                        'home-karat-table__pct',
                        dir === 'up' && 'home-karat-table__pct--up',
                        dir === 'down' && 'home-karat-table__pct--down',
                      )}
                      dir="ltr"
                    >
                      {dir === 'up' ? (
                        <ChevronUp className="home-karat-table__chevron" aria-hidden />
                      ) : dir === 'down' ? (
                        <ChevronDown className="home-karat-table__chevron" aria-hidden />
                      ) : null}
                      {pctLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
