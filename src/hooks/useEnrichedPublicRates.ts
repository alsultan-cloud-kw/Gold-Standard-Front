/**
 * Public storefront rates from /api/scraping/daralsabaek/public-rates/.
 * Optional GoldAPI current snap only when `goldOuncePrice` is missing (USD chart/nav).
 * Never synthesize KWD buyTotal/sellTotal from GoldAPI — Django additions must apply.
 */
import { useQuery } from '@tanstack/react-query'
import { adminApi, type DaralsabaekPublicRatesResponse } from '@/services/api'
import { pricingApi, toFiniteNumber, type CurrentMetalsResponse } from '@/services/pricingApi'

function enrichRates(
  base: DaralsabaekPublicRatesResponse | undefined,
  current: CurrentMetalsResponse | undefined,
): DaralsabaekPublicRatesResponse | undefined {
  if (!base?.succeeded) return base

  const m = current?.metals ?? {}
  const ounceUsd = toFiniteNumber(m.gold?.price)
  // Storefront KWD totals must stay on Django public-rates only — never synthesize
  // buyTotal/sellTotal from GoldAPI snapshots (no configured additions).
  return {
    ...base,
    source: base.source ?? 'goldapi.io',
    goldOuncePrice:
      base.goldOuncePrice ??
      (ounceUsd != null ? ounceUsd : undefined),
  }
}

export function useEnrichedPublicRates(refetchInterval = 20_000) {
  const publicQ = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval,
    retry: 1,
  })

  const pricingQ = useQuery({
    queryKey: ['pricingCurrentAll'],
    queryFn: async () => {
      try {
        return await pricingApi.getCurrentAll()
      } catch {
        return undefined
      }
    },
    refetchInterval,
    retry: 0,
    // Only fetch GoldAPI current when USD ounce spot missing from public-rates (charts/nav).
    enabled:
      publicQ.isSuccess &&
      (() => {
        const d = publicQ.data as DaralsabaekPublicRatesResponse | undefined
        return d?.succeeded === true && (d.goldOuncePrice == null || Number(d.goldOuncePrice) <= 0)
      })(),
  })

  const base = publicQ.data as DaralsabaekPublicRatesResponse | undefined
  const enriched = enrichRates(base, pricingQ.data)

  return {
    data: enriched,
    isLoading: publicQ.isLoading,
    isError: publicQ.isError,
    isFetching: publicQ.isFetching || pricingQ.isFetching,
    refetch: () => {
      publicQ.refetch()
      pricingQ.refetch()
    },
  }
}
