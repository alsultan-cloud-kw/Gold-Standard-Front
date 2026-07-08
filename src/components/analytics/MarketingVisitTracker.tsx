import { useEffect } from 'react'
import { trackMarketingVisit } from '@/lib/marketingVisit'

/** Records UTM / referrer landings for Central Hub email campaign insights. */
export default function MarketingVisitTracker() {
  useEffect(() => {
    void trackMarketingVisit()
  }, [])
  return null
}
