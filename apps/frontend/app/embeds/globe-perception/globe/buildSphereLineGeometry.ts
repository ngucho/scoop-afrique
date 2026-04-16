import * as THREE from 'three'
import type { FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson'
import { latLonToVec3, subsampleRing } from './latLonToVec3'

const R_LAND = 1.002
const MAX_RING_POINTS = 100

function pushRingSegments(
  ring: [number, number][],
  radius: number,
  bucket: number[],
): void {
  const simplified = subsampleRing(ring, MAX_RING_POINTS)
  for (let i = 0; i < simplified.length - 1; i++) {
    const lon = simplified[i]![0]
    const lat = simplified[i]![1]
    const lon2 = simplified[i + 1]![0]
    const lat2 = simplified[i + 1]![1]
    const a = latLonToVec3(lat, lon, radius)
    const b = latLonToVec3(lat2, lon2, radius)
    bucket.push(a.x, a.y, a.z, b.x, b.y, b.z)
  }
}

function walkGeometry(geometry: Geometry, radius: number, bucket: number[]): void {
  if (geometry.type === 'Polygon') {
    const g = geometry as Polygon
    for (const ring of g.coordinates) {
      pushRingSegments(ring as [number, number][], radius, bucket)
    }
  } else if (geometry.type === 'MultiPolygon') {
    const g = geometry as MultiPolygon
    for (const poly of g.coordinates) {
      for (const ring of poly) {
        pushRingSegments(ring as [number, number][], radius, bucket)
      }
    }
  }
}

export function buildLandLineGeometry(land: FeatureCollection): THREE.BufferGeometry {
  const bucket: number[] = []
  for (const f of land.features) {
    if (f.geometry) walkGeometry(f.geometry, R_LAND, bucket)
  }
  const geo = new THREE.BufferGeometry()
  const arr = new Float32Array(bucket)
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  return geo
}

export function buildAfricaLineGeometry(africa: FeatureCollection): THREE.BufferGeometry {
  const bucket: number[] = []
  for (const f of africa.features) {
    if (f.geometry) walkGeometry(f.geometry, R_LAND + 0.001, bucket)
  }
  const geo = new THREE.BufferGeometry()
  const arr = new Float32Array(bucket)
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  return geo
}
