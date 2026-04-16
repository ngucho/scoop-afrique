'use client'

import type { FeatureCollection } from 'geojson'
import { useEffect, useState } from 'react'

export type GlobeData = {
  land: FeatureCollection
  africa: FeatureCollection
}

export function useGlobeData(): { data: GlobeData | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<GlobeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [landRes, africaRes] = await Promise.all([
          fetch('/geo/ne_110m_land.geojson'),
          fetch('/geo/ne_110m_africa_countries.geojson'),
        ])
        if (!landRes.ok || !africaRes.ok) {
          throw new Error('Impossible de charger les données géographiques.')
        }
        const land = (await landRes.json()) as FeatureCollection
        const africa = (await africaRes.json()) as FeatureCollection
        if (!cancelled) {
          setData({ land, africa })
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur de chargement')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { data, error, loading }
}
