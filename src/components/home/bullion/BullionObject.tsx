import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import bullionHorizUrl from '@/assets/home/bullion-horiz.png'
import bullionVertUrl from '@/assets/home/bullion-vert.png'
import { compositionBridge } from './CameraRig'
import {
  bullionScrollState,
  damp,
  dampVec,
  type Vec3,
} from './scrollState'

const VERT_ASPECT = 1024 / 1536
const HORIZ_ASPECT = 1536 / 1024

/**
 * High-res PNG bullion as a floating physical plate.
 * Alpha preserved exactly — no keying, no color rewrite.
 */
export function BullionObject() {
  const group = useRef<THREE.Group>(null)
  const vertMat = useRef<THREE.MeshStandardMaterial>(null)
  const horizMat = useRef<THREE.MeshStandardMaterial>(null)

  const [vertMap, horizMap] = useTexture([bullionVertUrl, bullionHorizUrl])

  useMemo(() => {
    for (const map of [vertMap, horizMap]) {
      map.colorSpace = THREE.SRGBColorSpace
      map.anisotropy = 8
      map.generateMipmaps = true
      map.minFilter = THREE.LinearMipmapLinearFilter
      map.magFilter = THREE.LinearFilter
      map.premultiplyAlpha = false
    }
  }, [vertMap, horizMap])

  const livePos = useRef<Vec3>([1.15, 0.12, 0])
  const liveRot = useRef<Vec3>([0.06, -0.2, -0.035])
  const liveScale = useRef(1.18)
  const liveBlend = useRef(0)
  const breathPhase = useRef(Math.random() * Math.PI * 2)
  const momentumYaw = useRef(0)
  const prevTargetYaw = useRef(-0.2)

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return

    const clampedDt = Math.min(dt, 1 / 30)
    const pose = compositionBridge

    // Dense-metal inertia — slower than camera lag
    livePos.current = dampVec(livePos.current, pose.pos, 3.1, clampedDt)
    liveRot.current = dampVec(liveRot.current, pose.rot, 2.5, clampedDt)
    liveScale.current = damp(liveScale.current, pose.scale, 2.9, clampedDt)
    liveBlend.current = damp(liveBlend.current, pose.blend, 2.3, clampedDt)

    const yawDelta = pose.rot[1] - prevTargetYaw.current
    prevTargetYaw.current = pose.rot[1]
    momentumYaw.current += yawDelta * 0.55
    momentumYaw.current = damp(momentumYaw.current, 0, 1.8, clampedDt)

    breathPhase.current += clampedDt * 0.55
    const breathY = Math.sin(breathPhase.current) * 0.018
    const breathX = Math.sin(breathPhase.current * 0.73 + 1.1) * 0.01
    const breathRoll = Math.sin(breathPhase.current * 0.41) * 0.008

    const mx = bullionScrollState.pointerX * bullionScrollState.pointerActive * 0.12
    const my = bullionScrollState.pointerY * bullionScrollState.pointerActive * 0.08
    const mYaw = bullionScrollState.pointerX * bullionScrollState.pointerActive * 0.06
    const mPitch = -bullionScrollState.pointerY * bullionScrollState.pointerActive * 0.04

    g.position.set(
      livePos.current[0] + breathX + mx,
      livePos.current[1] + breathY + my,
      livePos.current[2],
    )
    g.rotation.set(
      liveRot.current[0] + mPitch,
      liveRot.current[1] + momentumYaw.current + mYaw,
      liveRot.current[2] + breathRoll,
    )
    g.scale.setScalar(liveScale.current)

    const blend = liveBlend.current
    if (vertMat.current) {
      vertMat.current.opacity = Math.max(0, 1 - blend)
      vertMat.current.transparent = true
      vertMat.current.depthWrite = blend < 0.55
    }
    if (horizMat.current) {
      horizMat.current.opacity = Math.max(0, Math.min(1, blend))
      horizMat.current.transparent = true
      horizMat.current.depthWrite = blend > 0.45
    }

    if (state.scene.environment) {
      state.scene.environmentRotation.y = bullionScrollState.progress * 0.55
    }
  })

  const vertH = 2.35
  const vertW = vertH * VERT_ASPECT
  const horizW = 2.55
  const horizH = horizW / HORIZ_ASPECT

  return (
    <group ref={group}>
      <mesh position={[0, 0, -0.012]} castShadow={false} receiveShadow={false}>
        <boxGeometry args={[vertW * 0.92, vertH * 0.92, 0.024]} />
        <meshStandardMaterial
          color="#8a6a28"
          metalness={0.92}
          roughness={0.28}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 0.002]} renderOrder={2}>
        <planeGeometry args={[vertW, vertH]} />
        <meshStandardMaterial
          ref={vertMat}
          map={vertMap}
          transparent
          metalness={0.38}
          roughness={0.36}
          envMapIntensity={0.7}
          side={THREE.FrontSide}
          depthWrite
          toneMapped
        />
      </mesh>

      <mesh position={[0, 0, 0.004]} renderOrder={3}>
        <planeGeometry args={[horizW, horizH]} />
        <meshStandardMaterial
          ref={horizMat}
          map={horizMap}
          transparent
          opacity={0}
          metalness={0.38}
          roughness={0.36}
          envMapIntensity={0.7}
          side={THREE.FrontSide}
          depthWrite={false}
          toneMapped
        />
      </mesh>
    </group>
  )
}
