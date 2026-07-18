import { MOTION } from './tokens'

/** Shared from-vars for fade-up entrances (luxury distances). */
export const fadeUpFrom = (distance: keyof typeof MOTION.y = 'md') => ({
  autoAlpha: 0,
  y: MOTION.y[distance],
})

export const fadeScaleFrom = {
  autoAlpha: 0,
  y: MOTION.y.sm,
  scale: 0.985,
}

/** Layered section reveal defaults — heading → body → children */
export const sectionRevealDefaults = {
  ease: MOTION.ease.out,
  duration: MOTION.duration.slow,
  stagger: MOTION.stagger.normal,
}

export const heroRevealDefaults = {
  ease: MOTION.ease.expoOut,
  duration: MOTION.duration.base,
  stagger: MOTION.stagger.relaxed,
}
