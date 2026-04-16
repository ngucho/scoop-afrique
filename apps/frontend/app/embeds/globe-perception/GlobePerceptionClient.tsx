'use client'

import dynamic from 'next/dynamic'
import { useCallback, useState } from 'react'
import { ContinentAreasPanel } from './globe/ContinentAreasPanel'
import { MercatorView } from './globe/MercatorView'
import { OrthographicView } from './globe/OrthographicView'
import { useGlobeData } from './globe/useGlobeData'

const AstronautView = dynamic(
  () => import('./globe/AstronautView').then((m) => ({ default: m.AstronautView })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(56vh,520px)] min-h-[280px] items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        Chargement du moteur 3D…
      </div>
    ),
  },
)

type VizMode = 'mercator' | 'projection' | 'astronaut'

const MODES: { id: VizMode; label: string; hint: string }[] = [
  {
    id: 'mercator',
    label: 'Mercator',
    hint: 'Même projection cylindrique, mais autre point de référence (rotation) : les masses visibles changent d’aspect — comparer aux superficies chiffrées ci-dessous.',
  },
  {
    id: 'projection',
    label: 'Projection variable',
    hint: 'Globe orthographique : faites tourner le point de vue — l’Afrique (rouge) change de taille apparente.',
  },
  {
    id: 'astronaut',
    label: 'Vision astronaute',
    hint: 'Perspective 3D depuis l’espace : zoom et angle modifient la lecture des continents.',
  },
]

/** Vue orthographique par défaut (Afrique) */
const DEFAULT_LON = -12
const DEFAULT_LAT = 6
/** Mercator : référence « atlas scolaire » (Greenland étiré au nord) */
const DEFAULT_MERC_LON = 0
const DEFAULT_MERC_LAT = 0

export function GlobePerceptionClient() {
  const { data, error, loading } = useGlobeData()
  const [mode, setMode] = useState<VizMode>('mercator')
  const [projLon, setProjLon] = useState(DEFAULT_LON)
  const [projLat, setProjLat] = useState(DEFAULT_LAT)
  const [mercRefLon, setMercRefLon] = useState(DEFAULT_MERC_LON)
  const [mercRefLat, setMercRefLat] = useState(DEFAULT_MERC_LAT)
  const [globeResetKey, setGlobeResetKey] = useState(0)

  const handleRotationChange = useCallback((lon: number, lat: number) => {
    setProjLon(lon)
    setProjLat(lat)
  }, [])

  const handleMercRefChange = useCallback((lon: number, lat: number) => {
    setMercRefLon(lon)
    setMercRefLat(lat)
  }, [])

  const reset = useCallback(() => {
    setMode('mercator')
    setProjLon(DEFAULT_LON)
    setProjLat(DEFAULT_LAT)
    setMercRefLon(DEFAULT_MERC_LON)
    setMercRefLat(DEFAULT_MERC_LAT)
    setGlobeResetKey((k) => k + 1)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background p-3 sm:p-5">
      <header className="mb-4 shrink-0 space-y-2 border-b border-border pb-4">
        <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
          Module interactif
        </p>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Perception du globe
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Comparez la carte Mercator à une sphère : la taille des continents dépend de la projection et du point
          d’observation. Données Natural Earth (domaine public), géométrie 110m.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
              mode === m.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-muted'
            }`}
          >
            {m.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary sm:text-sm"
        >
          Réinitialiser
        </button>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{MODES.find((x) => x.id === mode)?.hint}</p>

      <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-5">
        {loading && (
          <div
            className="flex min-h-[320px] items-center justify-center text-sm text-muted-foreground"
            aria-busy
          >
            Chargement des cartes…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {data && !loading && (
          <>
            {mode === 'mercator' && (
              <MercatorView
                land={data.land}
                refLon={mercRefLon}
                refLat={mercRefLat}
                onRefChange={handleMercRefChange}
              />
            )}
            {mode === 'projection' && (
              <OrthographicView
                land={data.land}
                africa={data.africa}
                lon={projLon}
                lat={projLat}
                onRotationChange={handleRotationChange}
              />
            )}
            {mode === 'astronaut' && (
              <AstronautView
                land={data.land}
                africa={data.africa}
                resetSignal={globeResetKey}
              />
            )}
          </>
        )}
      </div>

      {data && !loading && <ContinentAreasPanel />}

      <footer className="mt-6 border-t border-border pt-4 text-[11px] text-muted-foreground">
        Natural Earth · ne_110m_land · pays d’Afrique extraits (CONTINENT). Rendu isolé dans l’iframe du
        média.
      </footer>
    </div>
  )
}
