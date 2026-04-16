import * as THREE from 'three'

/** Y-up, matches common globe / three-globe conventions */
export function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Subsample long rings to keep line count reasonable on mobile */
export function subsampleRing<T extends [number, number]>(
  ring: T[],
  maxPoints: number,
): T[] {
  if (ring.length <= maxPoints) return ring
  const step = Math.ceil(ring.length / maxPoints)
  const out: T[] = []
  for (let i = 0; i < ring.length - 1; i += step) {
    out.push(ring[i]!)
  }
  out.push(ring[ring.length - 1]!)
  return out
}
