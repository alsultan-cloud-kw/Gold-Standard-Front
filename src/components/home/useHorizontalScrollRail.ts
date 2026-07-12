import { useCallback, useEffect, useRef, useState } from 'react'

function getNormalizedScrollLeft(el: HTMLElement): number {
  const max = el.scrollWidth - el.clientWidth
  if (max <= 0) return 0

  const isRtl = getComputedStyle(el).direction === 'rtl'
  if (!isRtl) return el.scrollLeft

  // Firefox: negative values when scrolled away from the start edge.
  if (el.scrollLeft < 0) return -el.scrollLeft
  // Chromium / Safari RTL: 0 at start, increases toward the end.
  return el.scrollLeft
}

export function useHorizontalScrollRail(contentKey?: string | number) {
  const railRef = useRef<HTMLDivElement>(null)
  const [canScrollBack, setCanScrollBack] = useState(false)
  const [canScrollForward, setCanScrollForward] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = railRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const pos = getNormalizedScrollLeft(el)
    setCanScrollBack(pos > 4)
    setCanScrollForward(pos < max - 4)
  }, [])

  const scrollToAdjacent = useCallback((direction: -1 | 1) => {
    const el = railRef.current
    if (!el) return

    const children = [...el.children] as HTMLElement[]
    if (children.length < 2) return

    const containerRect = el.getBoundingClientRect()
    let activeIndex = 0
    let bestVisible = -1

    children.forEach((child, index) => {
      const rect = child.getBoundingClientRect()
      const visible =
        Math.min(rect.right, containerRect.right) - Math.max(rect.left, containerRect.left)
      if (visible > bestVisible) {
        bestVisible = visible
        activeIndex = index
      }
    })

    const nextIndex = Math.max(0, Math.min(children.length - 1, activeIndex + direction))
    children[nextIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [])

  useEffect(() => {
    const el = railRef.current
    if (!el) return

    const scheduleUpdate = () => {
      requestAnimationFrame(updateScrollState)
    }

    scheduleUpdate()
    el.addEventListener('scroll', updateScrollState, { passive: true })

    const ro = new ResizeObserver(scheduleUpdate)
    ro.observe(el)

    const mo = new MutationObserver(scheduleUpdate)
    mo.observe(el, { childList: true, subtree: true })

    const imgs = el.querySelectorAll('img')
    imgs.forEach((img) => img.addEventListener('load', scheduleUpdate, { passive: true }))

    const tmr = window.setTimeout(scheduleUpdate, 120)
    const tmr2 = window.setTimeout(scheduleUpdate, 480)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
      mo.disconnect()
      imgs.forEach((img) => img.removeEventListener('load', scheduleUpdate))
      window.clearTimeout(tmr)
      window.clearTimeout(tmr2)
    }
  }, [updateScrollState, contentKey])

  return {
    railRef,
    canScrollBack,
    canScrollForward,
    scrollBack: () => scrollToAdjacent(-1),
    scrollForward: () => scrollToAdjacent(1),
  }
}
