/**
 * Single GSAP bootstrap for the storefront.
 * Import from here — never register ScrollTrigger ad-hoc in page files.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { MOTION } from './tokens'

let registered = false

export function ensureGsap() {
  if (registered) return { gsap, ScrollTrigger }
  gsap.registerPlugin(ScrollTrigger, useGSAP)
  gsap.defaults({
    ease: MOTION.ease.out,
    duration: MOTION.duration.base,
  })
  registered = true
  return { gsap, ScrollTrigger }
}

export { gsap, ScrollTrigger, useGSAP }
