import { useRef, type HTMLAttributes, type ReactNode } from 'react'
import { ensureGsap, useGSAP } from '@/motion/gsap'
import { MOTION } from '@/motion/tokens'
import { fadeUpFrom, sectionRevealDefaults } from '@/motion/presets'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

type RevealMode = 'section' | 'stagger' | 'fade'

type RevealSectionProps = {
  children: ReactNode
  className?: string
  /**
   * Render as a plain div (when nesting another landmark / section).
   * Default: semantic `<section>`.
   */
  as?: 'section' | 'div'
  /**
   * section — animate the whole block as one unit
   * stagger — animate `[data-reveal]` children
   * fade — opacity only
   */
  mode?: RevealMode
  /** Optional selector for stagger targets inside the root */
  staggerSelector?: string
  y?: keyof typeof MOTION.y
  start?: string
  once?: boolean
} & HTMLAttributes<HTMLElement>

/**
 * Scroll-triggered luxury reveal for storefront sections.
 * Respects prefers-reduced-motion. Transform + autoAlpha only.
 */
export function RevealSection({
  children,
  className,
  as = 'section',
  mode = 'section',
  staggerSelector = '[data-reveal]',
  y = 'md',
  start = MOTION.scroll.start,
  once = MOTION.scroll.once,
  ...rest
}: RevealSectionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const { gsap } = ensureGsap()

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || reduced) return

      const targets =
        mode === 'stagger'
          ? Array.from(
              root.querySelectorAll<HTMLElement>(staggerSelector),
            ).filter(Boolean)
          : [root]

      if (targets.length === 0) return

      const fromVars =
        mode === 'fade'
          ? { autoAlpha: 0 }
          : { ...fadeUpFrom(y) }

      gsap.from(targets, {
        ...fromVars,
        duration: sectionRevealDefaults.duration,
        ease: sectionRevealDefaults.ease,
        stagger: mode === 'stagger' ? MOTION.stagger.normal : 0,
        clearProps: mode === 'fade' ? 'visibility,opacity' : 'transform',
        scrollTrigger: {
          trigger: root,
          start,
          once,
          toggleActions: 'play none none none',
        },
      })
    },
    {
      dependencies: [mode, staggerSelector, y, start, once, reduced],
      scope: rootRef,
    },
  )

  const shared = {
    ref: rootRef,
    className: cn(className),
    ...rest,
  }

  if (as === 'div') {
    return <div {...shared}>{children}</div>
  }

  return <section {...shared}>{children}</section>
}
