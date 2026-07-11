import { Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BullionObject } from './BullionObject'
import { CameraRig } from './CameraRig'
import { bullionScrollState } from './scrollState'

/**
 * Studio lighting — jewelry / watch ad language.
 * Soft key, warm gold rim, cool fill. Controlled bloom.
 * Canvas clear alpha = 0 so the website shows through.
 */
export function CinematicScene() {
  const mobile = bullionScrollState.isMobile

  return (
    <>
      <ambientLight intensity={0.32} color="#e8eef5" />

      {/* Large soft key */}
      <directionalLight
        position={[3.2, 4.5, 2.8]}
        intensity={1.4}
        color="#fff6e8"
      />

      {/* Warm gold rim */}
      <directionalLight
        position={[-3.5, 1.2, -2.2]}
        intensity={0.9}
        color="#d4a84b"
      />

      {/* Cool fill */}
      <directionalLight
        position={[-1.5, -0.5, 3.5]}
        intensity={0.38}
        color="#b8c8e0"
      />

      {/* Soft overhead bounce */}
      <pointLight
        position={[0, 3.2, 1]}
        intensity={0.42}
        color="#ffe9c2"
        distance={12}
        decay={2}
      />

      <Environment preset="studio" environmentIntensity={0.5} />

      {/* CameraRig first so compositionBridge is ready for the object */}
      <CameraRig />
      <BullionObject />

      {!mobile ? (
        <ContactShadows
          position={[0, -1.55, 0]}
          opacity={0.18}
          scale={12}
          blur={2.8}
          far={4}
          color="#1a1208"
        />
      ) : null}

      {!mobile && !bullionScrollState.reduceMotion ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.22}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
        </EffectComposer>
      ) : null}
    </>
  )
}
