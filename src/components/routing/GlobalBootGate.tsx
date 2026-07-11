import { useEffect, useState, type ReactNode } from 'react'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

const MIN_BOOT_MS = 480

/**
 * First paint after JS mounts: keep the branded splash until auth boot finishes
 * (and a short minimum so HTML splash → React does not flash).
 */
export function GlobalBootGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  const [minElapsed, setMinElapsed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setMinElapsed(true), MIN_BOOT_MS)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!isLoading && minElapsed) setReady(true)
  }, [isLoading, minElapsed])

  if (!ready) {
    return <AppLoadingScreen variant="fullscreen" />
  }

  return <>{children}</>
}
