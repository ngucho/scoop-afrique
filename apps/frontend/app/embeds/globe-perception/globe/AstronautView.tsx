'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { FeatureCollection } from 'geojson'
import { useMemo } from 'react'
import * as THREE from 'three'
import { GLOBE_COLORS } from './editorialColors'
import { buildAfricaLineGeometry, buildLandLineGeometry } from './buildSphereLineGeometry'

type AstronautViewProps = {
  land: FeatureCollection
  africa: FeatureCollection
  resetSignal: number
  className?: string
}

function GlobeLines({
  landGeo,
  africaGeo,
}: {
  landGeo: THREE.BufferGeometry
  africaGeo: THREE.BufferGeometry
}) {
  const landMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GLOBE_COLORS.lineDark,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  )
  const africaMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GLOBE_COLORS.primary,
        transparent: true,
        opacity: 0.95,
      }),
    [],
  )

  return (
    <group>
      <lineSegments geometry={landGeo} material={landMat} />
      <lineSegments geometry={africaGeo} material={africaMat} />
    </group>
  )
}

function Scene({ land, africa }: { land: FeatureCollection; africa: FeatureCollection }) {
  const landGeo = useMemo(() => buildLandLineGeometry(land), [land])
  const africaGeo = useMemo(() => buildAfricaLineGeometry(africa), [africa])

  return (
    <>
      <color attach="background" args={[GLOBE_COLORS.ocean]} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 4, 6]} intensity={1.1} />
      <directionalLight position={[-4, -2, -4]} intensity={0.35} />

      <mesh>
        <sphereGeometry args={[0.992, 64, 64]} />
        <meshStandardMaterial
          color={GLOBE_COLORS.sphereOcean}
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>

      <GlobeLines landGeo={landGeo} africaGeo={africaGeo} />

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.45}
        maxDistance={4.2}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI - 0.15}
      />
    </>
  )
}

export function AstronautView({ land, africa, resetSignal, className }: AstronautViewProps) {
  return (
    <div className={className ?? 'w-full'}>
      <div className="h-[min(56vh,520px)] min-h-[280px] w-full overflow-hidden rounded-lg border border-border bg-card">
        <Canvas
          key={resetSignal}
          camera={{ position: [0.45, 0.35, 2.4], fov: 42, near: 0.1, far: 20 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          aria-label="Globe en perspective — faites glisser pour orbiter"
        >
          <Scene land={land} africa={africa} />
        </Canvas>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Clic ou doigt + glisser : orbiter autour du globe. Molette : zoom. L’Afrique est soulignée en rouge
        éditorial.
      </p>
    </div>
  )
}
