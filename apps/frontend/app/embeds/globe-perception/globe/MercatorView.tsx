'use client'

import type { FeatureCollection } from 'geojson'
import { geoGraticule, geoMercator, geoPath } from 'd3-geo'
import { useCallback, useEffect, useRef } from 'react'
import { GLOBE_COLORS } from './editorialColors'

export type MercatorViewProps = {
  land: FeatureCollection
  /** Longitude du « point de référence » (°) — fait tourner la sphère avant déroulé Mercator (effet oblique). */
  refLon: number
  /** Latitude du point de référence (°) */
  refLat: number
  onRefChange: (lon: number, lat: number) => void
  className?: string
}

/** Préréglages pédagogiques : même projection cylindrique, autre orientation de référence. */
const PANEL_PRESETS: { id: string; label: string; lon: number; lat: number; hint: string }[] = [
  {
    id: 'classic',
    label: 'Réf. classique',
    lon: 0,
    lat: 0,
    hint: 'Vue habituelle (Greenland très étiré vers le nord).',
  },
  {
    id: 'africa',
    label: 'Réf. Afrique',
    lon: -12,
    lat: 6,
    hint: 'Met l’Afrique au centre du déroulé : les proportions relatives changent par rapport au nord.',
  },
  {
    id: 'arctic',
    label: 'Réf. Arctique',
    lon: 0,
    lat: 72,
    hint: 'Met le pôle proche du centre : exagération des surfaces polaires.',
  },
]

export function MercatorView({
  land,
  refLon,
  refLat,
  onRefChange,
  className,
}: MercatorViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const w = wrap.clientWidth
    const h = Math.max(280, Math.min(520, Math.floor(w * 0.52)))
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.fillStyle = GLOBE_COLORS.ocean
    ctx.fillRect(0, 0, w, h)

    const pad = 12
    const projection = geoMercator()
      .rotate([-refLon, -refLat, 0])
      .fitExtent(
        [
          [pad, pad],
          [w - pad, h - pad],
        ],
        { type: 'Sphere' },
      )
      .precision(0.2)

    const path = geoPath(projection, ctx)

    const graticule = geoGraticule().step([30, 30])()
    ctx.beginPath()
    path(graticule)
    ctx.strokeStyle = GLOBE_COLORS.graticule
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    path(land)
    ctx.fillStyle = GLOBE_COLORS.landFill
    ctx.fill()
    ctx.strokeStyle = GLOBE_COLORS.landStroke
    ctx.lineWidth = 0.6
    ctx.stroke()

    ctx.fillStyle = GLOBE_COLORS.muted
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText(
      `Mercator — point de référence ≈ ${refLon.toFixed(0)}°, ${refLat.toFixed(0)}° (rotation avant déroulé)`,
      pad,
      h - 8,
    )
  }, [land, refLon, refLat])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(() => draw())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [draw])

  return (
    <div className={className ?? 'w-full'}>
      <div ref={wrapRef} className="w-full">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Carte Mercator avec point de référence réglable"
          className="block w-full rounded-lg border border-border bg-card"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PANEL_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onRefChange(p.lon, p.lat)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs ${
              Math.abs(refLon - p.lon) < 0.5 && Math.abs(refLat - p.lat) < 0.5
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted'
            }`}
            title={p.hint}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {PANEL_PRESETS.find(
          (p) => Math.abs(refLon - p.lon) < 0.5 && Math.abs(refLat - p.lat) < 0.5,
        )?.hint ??
          'La rotation change quelle région est « au milieu » du cylindre Mercator — les surfaces ne sont toujours pas proportionnelles aux réalités en km².'}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Longitude de référence</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={refLon}
            onChange={(e) => onRefChange(Number(e.target.value), refLat)}
            className="accent-primary"
          />
          <span className="font-mono text-[10px]">{refLon.toFixed(0)}°</span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Latitude de référence</span>
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={refLat}
            onChange={(e) => onRefChange(refLon, Number(e.target.value))}
            className="accent-primary"
          />
          <span className="font-mono text-[10px]">{refLat.toFixed(0)}°</span>
        </label>
      </div>
    </div>
  )
}
