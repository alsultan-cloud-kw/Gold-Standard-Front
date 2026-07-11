import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  bullionScrollState,
  clamp01,
  damp,
  dampVec,
  sampleKeyframes,
  smoothstep5,
  type Vec3,
} from './scrollState'

/** Live composition shared between CameraRig and BullionObject (same frame). */
export const compositionBridge = {
  pos: [1.15, 0.12, 0] as Vec3,
  rot: [0.06, -0.2, -0.035] as Vec3,
  scale: 1.18,
  blend: 0,
  zLift: 0.05,
}

/**
 * Map a viewport pixel to world XY on a plane at `planeZ`
 * using the active perspective camera frustum (stable product framing).
 */
function viewportToPlane(
  camera: THREE.PerspectiveCamera,
  clientX: number,
  clientY: number,
  planeZ: number,
): Vec3 {
  const w = window.innerWidth || 1
  const h = window.innerHeight || 1
  const ndcX = (clientX / w) * 2 - 1
  const ndcY = -(clientY / h) * 2 + 1
  const dist = Math.abs(camera.position.z - planeZ)
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * dist
  const halfW = halfH * (w / h)
  return [
    camera.position.x + ndcX * halfW,
    camera.position.y + ndcY * halfH,
    planeZ,
  ]
}

/**
 * Motion-control camera: dolly, truck, micro-orbit, handheld stabilisation,
 * anticipation lag — never harsh zooms or spin.
 * Also composes DOM seat → cinematic path → CTA settle for the protagonist.
 */
export function CameraRig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0.55, 0.08, 0))
  const liveCam = useRef<Vec3>([0.08, 0.06, 4.35])
  const liveLook = useRef<Vec3>([0.55, 0.08, 0])
  const handheld = useRef({ x: 0, y: 0, t: Math.random() * 10 })
  const prevProgress = useRef(0)
  const anticipate = useRef(0)

  useFrame((_, dt) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return

    const clampedDt = Math.min(dt, 1 / 30)
    const pose = sampleKeyframes(bullionScrollState.progress)
    const p = bullionScrollState.progress

    const deltaP = p - prevProgress.current
    prevProgress.current = p
    anticipate.current = damp(anticipate.current, deltaP * 18, 4.5, clampedDt)

    const planeZ = pose.pos[2] + pose.zLift
    let startWorld: Vec3 = [...pose.pos]
    let endWorld: Vec3 = [pose.pos[0], pose.pos[1], pose.pos[2]]
    if (bullionScrollState.hasSlots) {
      startWorld = viewportToPlane(
        camera,
        bullionScrollState.startScreen.x,
        bullionScrollState.startScreen.y,
        planeZ,
      )
      endWorld = viewportToPlane(
        camera,
        bullionScrollState.endScreen.x,
        bullionScrollState.endScreen.y,
        pose.pos[2],
      )
    }

    // Leave hero seat → cinematic middle → settle at CTA
    const leave = 1 - smoothstep5(Math.min(1, p / 0.14))
    const settle = smoothstep5(clamp01((p - 0.82) / 0.18))
    const mid = Math.max(0, 1 - leave - settle)

    const weightSum = leave + mid + settle || 1
    const composedPos: Vec3 = [
      (startWorld[0] * leave + pose.pos[0] * mid + endWorld[0] * settle) / weightSum,
      (startWorld[1] * leave + pose.pos[1] * mid + endWorld[1] * settle) / weightSum,
      (startWorld[2] * leave + (pose.pos[2] + pose.zLift) * mid + endWorld[2] * settle)
        / weightSum,
    ]

    compositionBridge.pos = composedPos
    compositionBridge.rot = pose.rot
    compositionBridge.scale = pose.scale * (0.98 + mid * 0.04)
    compositionBridge.blend = pose.blend
    compositionBridge.zLift = pose.zLift

    const camTarget: Vec3 = [
      pose.cam[0] + anticipate.current * 0.08,
      pose.cam[1] + Math.abs(anticipate.current) * 0.02,
      pose.cam[2] - anticipate.current * 0.15,
    ]
    const lookTarget: Vec3 = [
      composedPos[0] * 0.4 + pose.look[0] * 0.6
        + bullionScrollState.pointerX * bullionScrollState.pointerActive * 0.08,
      composedPos[1] * 0.3 + pose.look[1] * 0.7
        + bullionScrollState.pointerY * bullionScrollState.pointerActive * 0.05,
      pose.look[2],
    ]

    liveCam.current = dampVec(liveCam.current, camTarget, 2.1, clampedDt)
    liveLook.current = dampVec(liveLook.current, lookTarget, 2.4, clampedDt)

    handheld.current.t += clampedDt
    const amp = bullionScrollState.isMobile ? 0.004 : 0.007
    handheld.current.x =
      Math.sin(handheld.current.t * 0.37) * amp
      + Math.sin(handheld.current.t * 0.91) * amp * 0.4
    handheld.current.y =
      Math.cos(handheld.current.t * 0.29) * amp
      + Math.sin(handheld.current.t * 0.67) * amp * 0.35

    const orbit = Math.sin(handheld.current.t * 0.12 + p * 1.2) * 0.04

    camera.position.set(
      liveCam.current[0] + handheld.current.x + orbit,
      liveCam.current[1] + handheld.current.y,
      liveCam.current[2],
    )

    look.current.set(liveLook.current[0], liveLook.current[1], liveLook.current[2])
    camera.lookAt(look.current)

    const fovTarget = 34 - pose.zLift * 2.5 + Math.abs(anticipate.current) * 0.8
    camera.fov = damp(camera.fov, fovTarget, 1.6, clampedDt)
    camera.updateProjectionMatrix()
  }, -1)

  return null
}
