/**
 * After a deploy, open SPA tabs may still reference old hashed Vite chunks.
 * Missing /assets/* used to SPA-fallback to index.html → "Failed to fetch
 * dynamically imported module". Reload once to pick up the new index.html.
 */
export function installViteChunkLoadRecovery() {
  if (typeof window === 'undefined') return

  const RELOAD_KEY = 'gs_vite_chunk_reload'

  const reloadOnce = () => {
    try {
      if (sessionStorage.getItem(RELOAD_KEY) === '1') return
      sessionStorage.setItem(RELOAD_KEY, '1')
    } catch {
      /* private mode — still attempt one reload */
    }
    window.location.reload()
  }

  window.addEventListener('vite:preloadError', ((event: Event) => {
    event.preventDefault()
    reloadOnce()
  }) as EventListener)

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const msg = reason instanceof Error ? reason.message : String(reason ?? '')
    if (
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Importing a module script failed/i.test(msg) ||
      /error loading dynamically imported module/i.test(msg)
    ) {
      event.preventDefault()
      reloadOnce()
    }
  })

  // Clear the one-shot flag after a healthy boot so future deploys can recover again.
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(RELOAD_KEY)
    } catch {
      /* ignore */
    }
  }, 15_000)
}
