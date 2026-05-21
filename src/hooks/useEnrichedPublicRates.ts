/**
 * Public storefront rates from /api/scraping/daralsabaek/public-rates/,
 * enriched with /api/prices/current/ when palladium (or other metals) are missing
 * on older production backends.
 */
import { useQuery } from '@tanstack/react-query'
import {
  adminApi,
  type DaralsabaekPublicMetalSpot,
  type DaralsabaekPublicRatesResponse,
} from '@/services/api'
import {
  pricingApi,
  toFiniteNumber,
  type MetalKey,
  type MetalPriceSnapshot,
} from '@/services/pricingApi'

const PRECIOUS_LABEL: Record<MetalKey, string> = {
  gold: 'Gold',
  silver: 'Silver',
  platinum: 'Platinum',
  palladium: 'Palladium',
}

function snapshotToSpot(snap: MetalPriceSnapshot): DaralsabaekPublicMetalSpot {
  const gramKwd =
    toFiniteNumber(snap.price_gram_24k_kwd) ??
    (() => {
      const usd = toFiniteNumber(snap.price_gram_24k)
      const rate = toFiniteNumber(snap.usd_to_kwd_rate)
      if (usd != null && rate != null && rate > 0) return usd * rate
      return null
    })()

  const v = gramKwd
  return {
    key: PRECIOUS_LABEL[snap.friendly] ?? snap.metal,
    buy: v,
    sell: v,
    buyAdd: 0,
    sellAdd: 0,
    clubBuyAdd: 0,
    clubSellAdd: 0,
    buyTotal: v,
    sellTotal: v,
    buyTotalClub: v,
    sellTotalClub: v,
  }
}

function mergeSpot(
  existing: DaralsabaekPublicMetalSpot | null | undefined,
  snap: MetalPriceSnapshot | undefined,
): DaralsabaekPublicMetalSpot | null {
  if (existing && (existing.buyTotal != null || existing.sellTotal != null)) {
    return existing
  }
  if (snap) return snapshotToSpot(snap)
  return existing ?? null
}

function enrichRates(
  base: DaralsabaekPublicRatesResponse | undefined,
  current: { metals?: Partial<Record<MetalKey, MetalPriceSnapshot>> } | undefined,
): DaralsabaekPublicRatesResponse | undefined {
  if (!base?.succeeded) return base

  const m = current?.metals ?? {}
  const ounceUsd = toFiniteNumber(m.gold?.price)
  return {
    ...base,
    source: base.source ?? 'goldapi.io',
    goldOuncePrice:
      base.goldOuncePrice ??
      (ounceUsd != null ? ounceUsd : undefined),
    silver: mergeSpot(base.silver, m.silver),
    platinum: mergeSpot(base.platinum, m.platinum),
    palladium: mergeSpot(base.palladium, m.palladium),
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
    // Only fetch pricing when palladium (or silver/platinum) missing from public feed
    enabled:
      publicQ.isSuccess &&
      (() => {
        const d = publicQ.data as DaralsabaekPublicRatesResponse | undefined
        if (!d?.succeeded) return false
        const missingPd =
          !d.palladium ||
          (d.palladium.buyTotal == null && d.palladium.sellTotal == null)
        const missingAg =
          !d.silver ||
          (d.silver.buyTotal == null && d.silver.sellTotal == null)
        const missingPt =
          !d.platinum ||
          (d.platinum.buyTotal == null && d.platinum.sellTotal == null)
        return missingPd || missingAg || missingPt
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
