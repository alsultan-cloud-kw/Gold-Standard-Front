import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset window scroll on every route change (pathname + search).
 * Without this, navigating from a scrolled landing page (e.g. category tiles)
 * keeps the previous scroll offset on the destination page.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}
