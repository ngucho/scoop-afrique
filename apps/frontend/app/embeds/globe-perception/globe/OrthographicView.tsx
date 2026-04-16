'use client'

import type { FeatureCollection } from 'geojson'
import { geoGraticule, geoOrthographic, geoPath } from 'd3-geo'
import { useCallback, useEffect, useRef } from 'react'
import { GLOBE_COLORS } from './editorialColors'

type OrthographicViewProps = {
  land: FeatureCollection
  africa: FeatureCollection
  lon: number
  lat: number
  onRotationChange: (lon: number, lat: number) => void
  className?: string
}

export function OrthographicView({
  land,
  africa,
  lon,
  lat,
  onRotationChange,
  className,
}: OrthographicViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  })

  const draw = useCallback(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const w = wrap.clientWidth
    const h = Math.max(280, Math.min(560, w))

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

    const pad = 8
    const r = Math.min(w, h) / 2 - pad
    const projection = geoOrthographic()
      .scale(r)
      .translate([w / 2, h / 2])
      .rotate([-lon, -lat, 0])
      .clipAngle(90)

    const path = geoPath(projection, ctx)

    ctx.beginPath()
    path({ type: 'Sphere' })
    ctx.fillStyle = GLOBE_COLORS.ocean
    ctx.fill()
    ctx.strokeStyle = GLOBE_COLORS.landStroke
    ctx.lineWidth = 1
    ctx.stroke()

    const graticule = geoGraticule().step([15, 15])()
    ctx.beginPath()
    path(graticule)
    ctx.strokeStyle = GLOBE_COLORS.graticule
    ctx.lineWidth = 0.75
    ctx.stroke()

    ctx.beginPath()
    path(land)
    ctx.fillStyle = GLOBE_COLORS.landFill
    ctx.fill()
    ctx.strokeStyle = GLOBE_COLORS.landStroke
    ctx.lineWidth = 0.5
    ctx.stroke()

    ctx.beginPath()
    path(africa)
    ctx.fillStyle = GLOBE_COLORS.primaryMuted
    ctx.fill()
    ctx.beginPath()
    path(africa)
    ctx.strokeStyle = GLOBE_COLORS.africaStroke
    ctx.lineWidth = 1.25
    ctx.stroke()

    ctx.fillStyle = GLOBE_COLORS.muted
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('Faites glisser pour faire tourner le globe · Afrique en rouge', pad, h - 8)
  }, [land, africa, lon, lat])

  useEffect(() => {
    draw()
    const ro = new ResizeObserver(() => draw())
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [draw])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    const nextLon = lon - dx * 0.35
    let nextLat = lat - dy * 0.35
    nextLat = Math.max(-85, Math.min(85, nextLat))
    onRotationChange(
      ((nextLon + 180) % 360) - 180,
      nextLat,
    )
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.active = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={wrapRef} className={className ?? 'w-full'}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Globe en projection orthographique, glisser pour tourner"
        className="block w-full cursor-grab touch-none rounded-lg border border-border bg-card active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Longitude du centre</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={lon}
            onChange={(e) => onRotationChange(Number(e.target.value), lat)}
            className="accent-primary"
          />
          <span className="font-mono text-[10px]">{lon.toFixed(0)}°</span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Latitude du centre</span>
          <input
            type="range"
            min={-85}
            max={85}
            step={1}
            value={lat}
            onChange={(e) => onRotationChange(lon, Number(e.target.value))}
            className="accent-primary"
          />
          <span className="font-mono text-[10px]">{lat.toFixed(0)}°</span>
        </label>
      </div>
    </div>
  )
}
