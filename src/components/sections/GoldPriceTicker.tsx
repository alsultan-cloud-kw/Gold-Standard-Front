import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../../services/api'

export default function GoldPriceTicker() {
  const { data: goldPrices, isLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000, // align with PricesPage
  })

  if (isLoading) {
    return (
      <div className="bg-siteBg border-y border-amber-900/10 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-16 h-4 bg-gold-500/20 rounded" />
                <div className="w-20 h-4 bg-gold-500/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const res = goldPrices as DaralsabaekPublicRatesResponse | undefined
  const carats = res?.carats ?? []

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? n.toFixed(4) : '—'

  return (
    <div className="bg-siteBg border-y border-amber-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gold-400">Live Gold Prices</span>
          </div>
          
          <div className="flex items-center gap-6 md:gap-12 overflow-x-auto">
            {carats.map((c) => {
              const buyTotal = c.buyTotal
              const sellTotal = c.sellTotal
              const spread =
                typeof buyTotal === 'number' &&
                Number.isFinite(buyTotal) &&
                typeof sellTotal === 'number' &&
                Number.isFinite(sellTotal)
                  ? sellTotal - buyTotal
                  : 0

              return (
                <div key={c.key} className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-slate-700">
                  {c.key}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gold-500">
                    {fmt(buyTotal)}
                  </span>
                  <span className="text-xs text-slate-500">KWD/g</span>
                </div>
                  <PriceChangeIndicator spread={spread} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceChangeIndicator({ spread }: { spread: number }) {
  if (spread > 0) {
    return (
      <span className="flex items-center text-green-400 text-xs">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        +{spread.toFixed(2)}
      </span>
    )
  } else if (spread < 0) {
    return (
      <span className="flex items-center text-red-400 text-xs">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {spread.toFixed(2)}
      </span>
    )
  }
  return (
    <span className="flex items-center text-slate-500 text-xs">
      <Minus className="w-3 h-3 mr-0.5" />
      0.00
    </span>
  )
}
