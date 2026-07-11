/** Scroll to an in-page anchor, retrying until the target mounts (e.g. after route change). */
export function scrollToHash(hash: string, options?: { maxAttempts?: number; delayMs?: number }) {
  const id = hash.replace(/^#/, '')
  if (!id) return

  const maxAttempts = options?.maxAttempts ?? 16
  const delayMs = options?.delayMs ?? 50
  let attempts = 0

  const tryScroll = () => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    attempts += 1
    if (attempts < maxAttempts) {
      window.setTimeout(tryScroll, delayMs)
    }
  }

  tryScroll()
}
