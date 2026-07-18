/**
 * Luxury motion tokens — Gold Standard storefront.
 * Heavy, precise, calm. No bounce / elastic / back.
 * Distances stay small (gold feels heavy).
 */

export const MOTION = {
  ease: {
    /** Primary luxury exit — controlled weight */
    out: 'power3.out',
    /** Soft secondary reveals */
    softOut: 'power2.out',
    /** Strongest settle for hero / page enters */
    expoOut: 'expo.out',
    /** In-out for ambient loops only */
    sine: 'sine.inOut',
    /** Scroll scrub / linear progress */
    none: 'none',
  },

  duration: {
    instant: 0.2,
    fast: 0.35,
    base: 0.55,
    slow: 0.75,
    cinematic: 1.0,
    ambient: 3.2,
  },

  /** Translation distances in px — keep understated */
  y: {
    xs: 10,
    sm: 16,
    md: 24,
    lg: 32,
  },

  /** Stagger between siblings — reveal, never machine-gun */
  stagger: {
    tight: 0.045,
    normal: 0.065,
    relaxed: 0.085,
  },

  /** Hover micro-interactions (CSS + GSAP) */
  hover: {
    lift: 4,
    scale: 1.015,
    arrowX: 3,
  },

  scroll: {
    start: 'top 88%',
    startEarly: 'top 92%',
    once: true,
  },
} as const

export type MotionTokens = typeof MOTION
