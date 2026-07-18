import { useRef } from 'react'
import { ensureGsap, useGSAP } from '@/motion/gsap'
import { MOTION } from '@/motion/tokens'
import { fadeUpFrom, heroRevealDefaults } from '@/motion/presets'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

type PageEnterOptions = {
  /** Selector for staged children inside the root (default: data-motion targets). */
  childSelector?: string
  /** When false, skip animation (e.g. still loading). Default true. */
  enabled?: boolean
}

/**
 * One-shot page-enter for static storefront heroes.
 * Layered: root fade → children stagger upward.
 */
export function usePageEnter(options: PageEnterOptions = {}) {
  const {
    childSelector = '[data-motion="enter"]',
    enabled = true,
  } = options
  const rootRef = useRef<HTMLElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const { gsap } = ensureGsap()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !enabled) return

      if (reduced) {
        gsap.set(root, { clearProps: 'all' })
        gsap.set(root.querySelectorAll(childSelector), { clearProps: 'all' })
        return
      }

      const children = root.querySelectorAll(childSelector)
      const tl = gsap.timeline({
        defaults: {
          ease: heroRevealDefaults.ease,
          duration: MOTION.duration.slow,
        },
      })

      tl.from(root, {
        autoAlpha: 0,
        duration: MOTION.duration.base,
      })

      if (children.length > 0) {
        tl.from(
          children,
          {
            ...fadeUpFrom('md'),
            stagger: MOTION.stagger.relaxed,
            duration: MOTION.duration.slow,
            clearProps: 'transform',
          },
          '-=0.25',
        )
      }
    },
    { dependencies: [enabled, reduced, childSelector], scope: rootRef },
  )

  return rootRef
}
