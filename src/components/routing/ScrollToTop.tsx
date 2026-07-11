import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollToHash } from '@/utils/scrollToHash'

/**
 * Reset window scroll on pathname changes only.
 * Do NOT include `search` — filter/query edits (e.g. price range typing)
 * must not yank the page back to the top.
 *
 * When the URL has a hash (e.g. /#faq), scroll to that section instead.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      scrollToHash(hash)
      return
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
