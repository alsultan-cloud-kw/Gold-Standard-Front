/**
 * Shared cinematic scroll state — ScrollTrigger writes targets,
 * the R3F frame loop damps toward them (inertia / camera lag).
 */

export type Vec3 = [number, number, number]

export type BullionKeyframe = {
  /** 0–1 overall journey progress */
  p: number
  /** Object position in world units */
  pos: Vec3
  /** Object euler (rad) — keep ≤ ~15° */
  rot: Vec3
  /** Uniform scale */
  scale: number
  /** Camera position */
  cam: Vec3
  /** Look-at target */
  look: Vec3
  /** 0 = vertical PNG, 1 = horizontal PNG */
  blend: number
  /** Soft push toward viewer (Z depth accent) */
  zLift: number
}

/**
 * Cinematic chapters — rule-of-thirds compositions.
 * Eased between frames in the sampler (never linear).
 */
export const BULLION_KEYFRAMES: BullionKeyframe[] = [
  // Hero — floating reveal, right third
  {
    p: 0,
    pos: [1.15, 0.12, 0],
    rot: [0.06, -0.2, -0.035],
    scale: 1.18,
    cam: [0.08, 0.06, 4.35],
    look: [0.55, 0.08, 0],
    blend: 0,
    zLift: 0.05,
  },
  // Detach — lifts and begins travel
  {
    p: 0.12,
    pos: [0.55, 0.35, 0.35],
    rot: [0.04, -0.08, 0.02],
    scale: 1.12,
    cam: [0.12, 0.1, 4.0],
    look: [0.25, 0.2, 0],
    blend: 0.15,
    zLift: 0.28,
  },
  // Features / early trust — drifts left
  {
    p: 0.26,
    pos: [-1.05, 0.18, 0.15],
    rot: [0.03, 0.22, 0.04],
    scale: 1.02,
    cam: [0.2, 0.04, 3.75],
    look: [-0.45, 0.12, 0],
    blend: 0.45,
    zLift: 0.12,
  },
  // Trust — camera push-in
  {
    p: 0.4,
    pos: [0.05, 0.02, 0.45],
    rot: [0.09, -0.1, -0.02],
    scale: 1.22,
    cam: [0.02, 0.02, 3.05],
    look: [0.02, 0.02, 0],
    blend: 0.7,
    zLift: 0.4,
  },
  // Specs — slight yaw revealing “thickness”
  {
    p: 0.55,
    pos: [0.95, -0.08, 0.1],
    rot: [0.11, 0.28, -0.05],
    scale: 1.0,
    cam: [-0.18, 0.08, 3.45],
    look: [0.4, -0.02, 0],
    blend: 1,
    zLift: 0.08,
  },
  // Pricing — slow pull-back
  {
    p: 0.72,
    pos: [-0.7, 0.05, -0.15],
    rot: [0.045, -0.14, 0.025],
    scale: 0.92,
    cam: [0.05, 0.06, 4.55],
    look: [-0.25, 0.02, 0],
    blend: 0.85,
    zLift: -0.05,
  },
  // CTA — elegant settle beside call-to-action
  {
    p: 0.9,
    pos: [1.25, -0.18, 0.05],
    rot: [0.035, -0.18, -0.02],
    scale: 0.84,
    cam: [0.15, -0.02, 4.15],
    look: [0.6, -0.12, 0],
    blend: 0.55,
    zLift: 0.02,
  },
  {
    p: 1,
    pos: [1.32, -0.22, 0],
    rot: [0.025, -0.16, -0.015],
    scale: 0.8,
    cam: [0.16, -0.03, 4.2],
    look: [0.65, -0.14, 0],
    blend: 0.5,
    zLift: 0,
  },
]

export type BullionScrollState = {
  /** Scrubbed target from ScrollTrigger */
  targetProgress: number
  /** Damned display progress (inertia) */
  progress: number
  /** Pointer NDC when near object (−1…1), else 0 */
  pointerX: number
  pointerY: number
  pointerActive: number
  ready: boolean
  reduceMotion: boolean
  isMobile: boolean
  /** Hero slot center in CSS px (viewport) — projected each frame */
  startScreen: { x: number; y: number; w: number; h: number }
  /** Journey end slot center in CSS px */
  endScreen: { x: number; y: number; w: number; h: number }
  hasSlots: boolean
}

export const bullionScrollState: BullionScrollState = {
  targetProgress: 0,
  progress: 0,
  pointerX: 0,
  pointerY: 0,
  pointerActive: 0,
  ready: false,
  reduceMotion: false,
  isMobile: false,
  startScreen: { x: 0, y: 0, w: 0, h: 0 },
  endScreen: { x: 0, y: 0, w: 0, h: 0 },
  hasSlots: false,
}

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t))
}

/** Quintic smoothstep — cinematic acceleration / deceleration */
export function smoothstep5(t: number) {
  const x = clamp01(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

export type SampledPose = {
  pos: Vec3
  rot: Vec3
  scale: number
  cam: Vec3
  look: Vec3
  blend: number
  zLift: number
}

/** Sample choreography with non-linear segment easing. */
export function sampleKeyframes(progress: number, frames = BULLION_KEYFRAMES): SampledPose {
  const p = clamp01(progress)
  if (p <= frames[0].p) {
    const f = frames[0]
    return {
      pos: [...f.pos],
      rot: [...f.rot],
      scale: f.scale,
      cam: [...f.cam],
      look: [...f.look],
      blend: f.blend,
      zLift: f.zLift,
    }
  }
  const last = frames[frames.length - 1]
  if (p >= last.p) {
    return {
      pos: [...last.pos],
      rot: [...last.rot],
      scale: last.scale,
      cam: [...last.cam],
      look: [...last.look],
      blend: last.blend,
      zLift: last.zLift,
    }
  }

  let i = 0
  while (i < frames.length - 1 && frames[i + 1].p < p) i += 1
  const a = frames[i]
  const b = frames[i + 1]
  const span = Math.max(1e-6, b.p - a.p)
  const t = smoothstep5((p - a.p) / span)

  return {
    pos: lerpVec(a.pos, b.pos, t),
    rot: lerpVec(a.rot, b.rot, t),
    scale: lerp(a.scale, b.scale, t),
    cam: lerpVec(a.cam, b.cam, t),
    look: lerpVec(a.look, b.look, t),
    blend: lerp(a.blend, b.blend, t),
    zLift: lerp(a.zLift, b.zLift, t),
  }
}

/** Exp damp toward target — mass / inertia feel */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt))
}

export function dampVec(current: Vec3, target: Vec3, lambda: number, dt: number): Vec3 {
  return [
    damp(current[0], target[0], lambda, dt),
    damp(current[1], target[1], lambda, dt),
    damp(current[2], target[2], lambda, dt),
  ]
}
