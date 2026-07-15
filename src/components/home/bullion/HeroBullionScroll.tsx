import { useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import bullionHorizUrl from '@/assets/home/bullion-horiz.png'
import bullionVertUrl from '@/assets/home/bullion-vert.png'
import { cn } from '@/lib/utils'
import { BULLION_FLYER_MQ, prefersBullionFlyer } from './flyerMedia'

gsap.registerPlugin(ScrollTrigger)

const FLYER_EVENT = 'gs-bullion-flyer'

function setFlyerActive(active: boolean) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FLYER_EVENT, { detail: { active } }))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}

function easeOutCubic(t: number) {
  const x = clamp01(t)
  return 1 - (1 - x) ** 3
}

type StopRef = RefObject<HTMLElement | null>

type JourneyProps = {
  stops: StopRef[]
}

type Seat = {
  cx: number
  cy: number
  bound: number
}

type Pose = {
  cx: number
  cy: number
  bound: number
  travel: number
  flight: number
  opacity: number
  segment: number
  segmentCount: number
  atAnchor: boolean
}

/**
 * Approach progress of a dock seat, from its viewport Y.
 * 0 = seat still low in the viewport · 1 = seat reached its landing line.
 */
function seatApproachT(seatCy: number, vh: number, startFrac: number, landFrac: number) {
  const start = vh * startFrac
  const land = vh * landFrac
  return clamp01((start - seatCy) / (start - land))
}

/**
 * Scroll-reactive journey, no fades.
 * Hero stay is gated so large text / short viewports don’t yank the bar
 * toward the next dock while the user is still looking at the hero.
 */
function sampleJourney(seats: Seat[], vh: number): Pose {
  const n = seats.length - 1
  if (n < 1) {
    const s = seats[0] ?? { cx: 0, cy: 0, bound: 200 }
    return {
      cx: s.cx,
      cy: s.cy,
      bound: s.bound,
      travel: 0,
      flight: 0,
      opacity: 1,
      segment: 0,
      segmentCount: 1,
      atAnchor: true,
    }
  }

  const hero = seats[0]
  const trust = seats[1]
  const final = seats[2] ?? seats[seats.length - 1]

  // Hero must have scrolled up before later legs can steal the bar
  const heroLeaving = hero.cy < vh * 0.42

  const finalT = heroLeaving
    ? easeOutCubic(seatApproachT(final.cy, vh, 0.92, 0.42))
    : 0
  if (finalT > 0) {
    const overhead = -final.bound * 0.75
    return {
      cx: final.cx,
      cy: lerp(overhead, final.cy, finalT),
      bound: final.bound,
      travel: finalT,
      flight: Math.sin(Math.PI * finalT) * 0.5,
      opacity: 1,
      segment: n - 1,
      segmentCount: n,
      atAnchor: finalT >= 0.995,
    }
  }

  const trustT = heroLeaving
    ? easeOutCubic(seatApproachT(trust.cy, vh, 0.88, 0.48))
    : 0
  if (trustT > 0) {
    const flight = Math.sin(Math.PI * trustT)
    const arc = flight * Math.min(vh * 0.05, 44)
    return {
      cx: lerp(hero.cx, trust.cx, trustT),
      cy: lerp(hero.cy, trust.cy, trustT) - arc,
      bound: lerp(hero.bound, trust.bound, trustT),
      travel: trustT,
      flight,
      opacity: 1,
      segment: 0,
      segmentCount: n,
      atAnchor: trustT >= 0.995,
    }
  }

  return {
    cx: hero.cx,
    cy: hero.cy,
    bound: hero.bound,
    travel: 0,
    flight: 0,
    opacity: 1,
    segment: 0,
    segmentCount: n,
    atAnchor: true,
  }
}

/**
 * Reference-stop flyer: hero → heritage → gold vs cash.
 * Both reference docks use the same scroll-tied fall-from-above settle.
 */
export function HeroBullionScroll({ stops }: JourneyProps) {
  const { t } = useTranslation()
  const layerRef = useRef<HTMLDivElement | null>(null)
  const vertRef = useRef<HTMLImageElement | null>(null)
  const horizRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const vert = vertRef.current
    const horiz = horizRef.current
    const layer = layerRef.current
    if (!vert || !horiz || !layer) return

    let cancelled = false
    let st: ScrollTrigger | null = null
    let resizeObservers: ResizeObserver[] = []
    let onScroll: (() => void) | null = null
    let onResize: (() => void) | null = null
    let onMq: (() => void) | null = null
    let raf = 0
    let tries = 0
    const mq = window.matchMedia(BULLION_FLYER_MQ)
    const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const clearListeners = () => {
      if (onScroll) window.removeEventListener('scroll', onScroll)
      if (onResize) window.removeEventListener('resize', onResize)
      onScroll = null
      onResize = null
      resizeObservers.forEach((ro) => ro.disconnect())
      resizeObservers = []
      st?.kill()
      st = null
    }

    const teardown = () => {
      clearListeners()
      setReady(false)
      setFlyerActive(false)
      layer.style.opacity = '0'
      layer.style.visibility = 'hidden'
    }

    const bootJourney = () => {
      if (cancelled) return

      clearListeners()

      if (!prefersBullionFlyer()) {
        teardown()
        return
      }

      const els = stops.map((s) => s.current).filter(Boolean) as HTMLElement[]
      if (els.length < stops.length) {
        tries += 1
        if (tries < 120) raf = requestAnimationFrame(bootJourney)
        return
      }

      const startEl = els[0]
      const endEl = els[els.length - 1]

      const readSeats = (): Seat[] =>
        els.map((el) => {
          const r = el.getBoundingClientRect()
          return {
            cx: r.left + r.width / 2,
            cy: r.top + r.height / 2,
            bound: Math.min(r.width, r.height) * 0.92,
          }
        })

      const place = () => {
        if (!prefersBullionFlyer()) {
          teardown()
          return
        }

        const seats = readSeats()
        const {
          cx,
          cy,
          bound,
          travel,
          flight,
          segment,
          segmentCount,
          atAnchor,
        } = sampleJourney(seats, window.innerHeight)

        const restRot = lerp(-3, 4, segment / Math.max(1, segmentCount))
        const restRotY = lerp(8, -6, segment / Math.max(1, segmentCount))
        const rot = restRot + flight * lerp(-2, 5, travel)
        const rotY = restRotY + flight * lerp(4, -7, travel)
        const lift = atAnchor ? 1 : lerp(0.99, 0.965, flight)

        const showHoriz = segment > 0

        layer.style.zIndex = '30'
        layer.style.opacity = '1'
        layer.style.visibility = 'visible'
        layer.style.pointerEvents = 'none'

        const fit = (el: HTMLImageElement, show: boolean, extraRot = 0) => {
          const nw = el.naturalWidth || 1
          const nh = el.naturalHeight || 1
          const aspect = nw / nh
          let w: number
          let h: number
          if (aspect >= 1) {
            w = bound
            h = bound / aspect
          } else {
            h = bound
            w = bound * aspect
          }
          el.style.width = `${w}px`
          el.style.height = `${h}px`
          el.style.opacity = '1'
          el.style.visibility = show ? 'visible' : 'hidden'
          el.style.transform = [
            `translate3d(${cx - w / 2}px, ${cy - h / 2}px, 0)`,
            `rotate(${rot + extraRot}deg)`,
            `rotateY(${rotY}deg)`,
            `scale(${lift})`,
          ].join(' ')
        }

        fit(vert, !showHoriz, -1)
        fit(horiz, showHoriz, 2)
      }

      const sync = () => place()

      st = ScrollTrigger.create({
        trigger: startEl,
        endTrigger: endEl,
        start: 'top center',
        end: 'center center',
        scrub: 1.15,
        invalidateOnRefresh: true,
        onUpdate: sync,
        onRefresh: sync,
      })

      const refreshLayout = () => {
        ScrollTrigger.refresh()
        sync()
      }

      resizeObservers = els.flatMap((el) => {
        const nodes = [el, el.parentElement, el.parentElement?.parentElement].filter(
          Boolean,
        ) as HTMLElement[]
        return nodes.map((node) => {
          const ro = new ResizeObserver(() => refreshLayout())
          ro.observe(node)
          return ro
        })
      })

      onScroll = sync
      window.addEventListener('scroll', onScroll, { passive: true })

      onResize = refreshLayout
      window.addEventListener('resize', onResize)

      Promise.all([
        vert.decode?.().catch(() => undefined) ?? Promise.resolve(),
        horiz.decode?.().catch(() => undefined) ?? Promise.resolve(),
      ]).then(() => {
        if (cancelled) return
        place()
        setReady(true)
        setFlyerActive(true)
        ScrollTrigger.refresh()
        sync()
      })
    }

    onMq = () => {
      tries = 0
      teardown()
      bootJourney()
    }
    mq.addEventListener?.('change', onMq)
    reduceMq.addEventListener?.('change', onMq)
    mq.addListener?.(onMq)
    reduceMq.addListener?.(onMq)

    bootJourney()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      if (onMq) {
        mq.removeEventListener?.('change', onMq)
        reduceMq.removeEventListener?.('change', onMq)
        mq.removeListener?.(onMq)
        reduceMq.removeListener?.(onMq)
      }
      teardown()
    }
  }, [stops])

  return (
    <div
      ref={layerRef}
      className={cn(
        'bullion-flyer-layer pointer-events-none fixed inset-0 z-30 overflow-hidden',
        ready ? '' : 'opacity-0',
      )}
      aria-hidden
    >
      <div
        className="absolute left-0 top-0 h-full w-full"
        style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
      >
        <img
          ref={vertRef}
          src={bullionVertUrl}
          alt=""
          draggable={false}
          className="absolute left-0 top-0"
          style={{
            transformOrigin: '50% 50%',
            opacity: 1,
            visibility: 'hidden',
            backfaceVisibility: 'hidden',
          }}
        />
        <img
          ref={horizRef}
          src={bullionHorizUrl}
          alt=""
          draggable={false}
          className="absolute left-0 top-0"
          style={{
            transformOrigin: '50% 50%',
            visibility: 'hidden',
            opacity: 1,
            backfaceVisibility: 'hidden',
          }}
        />
      </div>
      <span className="sr-only">{t('home.bullionScroll.aria')}</span>
    </div>
  )
}

export function BullionStartSlot({
  slotRef,
  className,
}: {
  slotRef: RefObject<HTMLDivElement | null>
  className?: string
}) {
  const { t } = useTranslation()
  /** Static bar stays until a real desktop flyer is active — survives zoom / large text. */
  const [hideForFlyer, setHideForFlyer] = useState(false)

  useEffect(() => {
    const sync = (active?: boolean) => {
      const flyerOk = prefersBullionFlyer()
      if (!flyerOk) {
        setHideForFlyer(false)
        return
      }
      if (typeof active === 'boolean') {
        setHideForFlyer(active)
        return
      }
      setHideForFlyer(false)
    }

    sync(false)

    const onFlyer = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail
      sync(Boolean(detail?.active))
    }
    const onMq = () => sync(false)

    window.addEventListener(FLYER_EVENT, onFlyer)
    const mq = window.matchMedia(BULLION_FLYER_MQ)
    mq.addEventListener?.('change', onMq)
    mq.addListener?.(onMq)

    return () => {
      window.removeEventListener(FLYER_EVENT, onFlyer)
      mq.removeEventListener?.('change', onMq)
      mq.removeListener?.(onMq)
    }
  }, [])

  return (
    <div
      ref={slotRef}
      className={cn(
        'relative mx-auto flex w-full items-center justify-center',
        !className?.includes('home-hero-bullion-slot') &&
          'max-w-[11rem] h-[clamp(7.25rem,34vw,11rem)] min-h-[7.25rem] sm:max-w-[18rem] sm:h-[clamp(14rem,32vw,20rem)] sm:min-h-[14rem] lg:max-w-[20rem] lg:h-[clamp(16rem,26vw,22rem)] lg:min-h-[16rem]',
        className,
      )}
      aria-label={t('home.bullionScroll.aria')}
    >
      <img
        src={bullionVertUrl}
        alt=""
        className={cn(
          'relative z-0 mx-auto h-[88%] w-auto max-w-full object-contain drop-shadow-[0_14px_28px_rgba(15,23,42,0.16)] transition-opacity duration-200',
          hideForFlyer ? 'opacity-0' : 'opacity-100',
        )}
        draggable={false}
      />
    </div>
  )
}

export function BullionChapterAnchor({
  slotRef,
  className,
  heightClass = 'h-0',
}: {
  slotRef?: RefObject<HTMLDivElement | null>
  className?: string
  heightClass?: string
}) {
  return (
    <div
      ref={slotRef}
      data-bullion-chapter
      className={cn('pointer-events-none relative w-full', heightClass, className)}
      aria-hidden
    />
  )
}

/** Composition dock for a journey stop. */
export function BullionEndDock({
  slotRef,
  className,
  size = 'default',
}: {
  slotRef: RefObject<HTMLDivElement | null>
  className?: string
  size?: 'default' | 'compact' | 'large'
}) {
  const [hideForFlyer, setHideForFlyer] = useState(false)

  useEffect(() => {
    const sync = (active?: boolean) => {
      if (!prefersBullionFlyer()) {
        setHideForFlyer(false)
        return
      }
      if (typeof active === 'boolean') {
        setHideForFlyer(active)
        return
      }
      setHideForFlyer(false)
    }

    sync(false)
    const onFlyer = (e: Event) => {
      const detail = (e as CustomEvent<{ active?: boolean }>).detail
      sync(Boolean(detail?.active))
    }
    const onMq = () => sync(false)
    window.addEventListener(FLYER_EVENT, onFlyer)
    const mq = window.matchMedia(BULLION_FLYER_MQ)
    mq.addEventListener?.('change', onMq)
    mq.addListener?.(onMq)
    return () => {
      window.removeEventListener(FLYER_EVENT, onFlyer)
      mq.removeEventListener?.('change', onMq)
      mq.removeListener?.(onMq)
    }
  }, [])

  return (
    <div
      ref={slotRef}
      className={cn(
        'relative mx-auto flex w-full items-center justify-center',
        size === 'compact' && 'h-8 max-w-[200px] sm:h-10 sm:max-w-[240px]',
        size === 'default' &&
          'h-[120px] max-w-[200px] sm:h-[180px] sm:max-w-[220px] lg:h-[220px] lg:max-w-[240px]',
        size === 'large' &&
          'h-[140px] max-w-[220px] sm:h-[200px] sm:max-w-[240px] lg:h-[260px] lg:max-w-[300px]',
        className,
      )}
      aria-hidden
    >
      <img
        src={bullionHorizUrl}
        alt=""
        className={cn(
          'h-[88%] w-auto max-w-full object-contain drop-shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition-opacity duration-200',
          hideForFlyer ? 'opacity-0' : 'opacity-100',
        )}
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
