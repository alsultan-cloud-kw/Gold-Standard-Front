import { useEffect } from 'react'
import { syncWebPushOnLaunch } from '@/lib/webPush'

/** Registers the Web Push service worker and re-syncs subscription when preferred. */
export default function WebPushBootstrap() {
  useEffect(() => {
    void syncWebPushOnLaunch()
  }, [])
  return null
}
