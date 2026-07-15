import { useEffect, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PricesHistoryChart } from '@/components/prices/PricesHistoryChart'
import { BullionEndDock } from '@/components/home/bullion'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import type { DaralsabaekPublicRatesResponse } from '@/services/api'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  /** Journey stop above the live market chart. */
  bullionDockRef?: RefObject<HTMLDivElement | null>
}

/** Live metal chart — same block as /prices, embedded on the homepage. */
export function LiveGoldMarketSection({ bullionDockRef }: Props) {
  const { t } = useTranslation()
  const { data, isLoading } = useEnrichedPublicRates(20_000)
  const res = data as DaralsabaekPublicRatesResponse | undefined
  const showChart = !isLoading && res?.succeeded

  useEffect(() => {
    if (isLoading) return
    const refresh = () => ScrollTrigger.refresh()
    const raf = requestAnimationFrame(refresh)
    const tmr = window.setTimeout(refresh, 400)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(tmr)
    }
  }, [isLoading, showChart])

  return (
    <section className="home-section border-t border-black/5">
      <div className="home-section-inner">
        {bullionDockRef ? (
          <BullionEndDock
            slotRef={bullionDockRef}
            size="large"
            className="mb-6 sm:mb-8"
          />
        ) : null}

        {isLoading ? (
          <AppLoadingScreen
            message={t('common.loading')}
            className="min-h-[min(52vh,420px)] rounded-2xl border border-black/5 bg-white"
          />
        ) : null}

        {showChart ? (
          <div
            className="relative space-y-5 bg-[var(--site-bg)]"
            data-bullion-clear-zone="live-market-chart"
          >
            <PricesHistoryChart rates={res} />
            <div className="flex justify-center">
              <Link
                to="/prices"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F6F00] transition-colors hover:text-[#4F8E00]"
              >
                {t('home.chart.viewFullPrices')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
