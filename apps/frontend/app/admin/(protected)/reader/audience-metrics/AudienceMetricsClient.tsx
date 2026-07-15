'use client'

import { useState, useTransition, useMemo } from 'react'
import { Button, Input, Label, Select } from 'scoop'
import { IconPlus, IconX, IconChevronDown, IconChevronUp, IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react'
import type { AudienceMetricLatestRow, AudienceMetricSnapshot } from '@/lib/api/types'
import { ingestAudienceMetric } from '@/lib/admin/actions'
import { hasMinRole, type AppRole } from '@/lib/admin/rbac'
import {
  AUDIENCE_METRIC_KEY_OPTIONS,
  AUDIENCE_PLATFORM_OPTIONS,
  AUDIENCE_SOURCE_OPTIONS,
  PLATFORM_RELEVANT_METRICS,
  PLATFORM_KEY_METRIC,
} from '@/lib/admin/audienceMetricOptions'

/* ── Sparkline (pure SVG, no lib needed) ─────────────────────────── */
function Sparkline({ values, color = '#b70100', width = 80, height = 32 }: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (values.length < 2) return <div style={{ width, height }} />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  const points = values.map((v, i) => {
    const x = pad + ((i / (values.length - 1)) * (width - pad * 2))
    const y = pad + ((1 - (v - min) / range) * (height - pad * 2))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const lastX = pad + (width - pad * 2)
  const lastY = pad + ((1 - (values[values.length - 1]! - min) / range) * (height - pad * 2))
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace('.0', '')}k`
  return n.toLocaleString('fr-FR')
}
function fmtFull(n: number): string {
  return n.toLocaleString('fr-FR')
}
function metricLabel(key: string): string {
  return AUDIENCE_METRIC_KEY_OPTIONS.find((o) => o.value === key)?.label ?? key
}

/* ── Types ───────────────────────────────────────────────────────── */
interface PlatformSummary {
  platform: string
  keyMetric: string
  latestValue: number | null
  latestDate: string | null
  delta7d: number | null  // ratio: +0.05 = +5%
  sparkValues: number[]
  metricsAvailable: string[]
}

interface Props {
  recent: AudienceMetricSnapshot[]
  latest: AudienceMetricLatestRow[]
  userRole: AppRole
}

/* ══════════════════════════════════════════════════════════════════ */
export function AudienceMetricsClient({ recent, latest, userRole }: Props) {
  const canIngest = hasMinRole(userRole, 'editor')

  /* ── Compute per-platform summaries ────────────────────────────── */
  const platformSummaries = useMemo((): PlatformSummary[] => {
    // Group snapshots by platform → metric_key → sorted by date
    const byPlatformMetric = new Map<string, Map<string, AudienceMetricSnapshot[]>>()
    for (const snap of recent) {
      if (!byPlatformMetric.has(snap.platform)) byPlatformMetric.set(snap.platform, new Map())
      const byMetric = byPlatformMetric.get(snap.platform)!
      if (!byMetric.has(snap.metric_key)) byMetric.set(snap.metric_key, [])
      byMetric.get(snap.metric_key)!.push(snap)
    }

    // Determine platforms with data (from latest + recent)
    const platforms = new Set([
      ...latest.map((r) => r.platform),
      ...recent.map((r) => r.platform),
    ])

    return Array.from(platforms).map((platform): PlatformSummary => {
      const keyMetric = PLATFORM_KEY_METRIC[platform] ?? 'followers'
      const byMetric = byPlatformMetric.get(platform)
      const metricRows = byMetric?.get(keyMetric)
        ?.slice()
        .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)) ?? []

      // Latest value (prefer from `latest` table)
      const latestRow = latest.find((r) => r.platform === platform && r.metric_key === keyMetric)
      const latestValue = latestRow ? Number(latestRow.value_numeric) : (metricRows[metricRows.length - 1] ? Number(metricRows[metricRows.length - 1]!.value_numeric) : null)
      const latestDate = latestRow?.snapshot_date ?? metricRows[metricRows.length - 1]?.snapshot_date ?? null

      // 7-day delta
      let delta7d: number | null = null
      if (metricRows.length >= 2 && latestValue !== null) {
        const referenceDate = new Date(latestDate ?? metricRows[metricRows.length - 1]!.snapshot_date)
        referenceDate.setDate(referenceDate.getDate() - 7)
        const cutoff = referenceDate.toISOString().slice(0, 10)
        const before = metricRows.filter((r) => r.snapshot_date <= cutoff)
        const beforeVal = before.length ? Number(before[before.length - 1]!.value_numeric) : null
        if (beforeVal && beforeVal > 0) delta7d = (latestValue - beforeVal) / beforeVal
      }

      // Sparkline: up to last 30 data points for key metric
      const sparkValues = metricRows.slice(-30).map((r) => Number(r.value_numeric))

      // All metrics available for this platform (in history or latest)
      const metricsAvailable = Array.from(new Set([
        ...Array.from(byMetric?.keys() ?? []),
        ...latest.filter((r) => r.platform === platform).map((r) => r.metric_key),
      ]))

      return { platform, keyMetric, latestValue, latestDate, delta7d, sparkValues, metricsAvailable }
    }).sort((a, b) => {
      // Sort by whether they have data, then by platform order
      const hasA = a.latestValue !== null ? 1 : 0
      const hasB = b.latestValue !== null ? 1 : 0
      return hasB - hasA
    })
  }, [recent, latest])

  /* ── State ──────────────────────────────────────────────────────── */
  const [activePlatform, setActivePlatform] = useState<string | null>(null)
  const [showIngestModal, setShowIngestModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Ingest form
  const [pending, startTransition] = useTransition()
  const [selectedPlatform, setSelectedPlatform] = useState(AUDIENCE_PLATFORM_OPTIONS[0]?.value ?? 'instagram')
  const [step, setStep] = useState<1 | 2>(1)
  const [metricKey, setMetricKey] = useState('followers')
  const [metricKeyCustom, setMetricKeyCustom] = useState('')
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [countryCode, setCountryCode] = useState('')
  const [valueNumeric, setValueNumeric] = useState('')
  const [source, setSource] = useState('manual')
  const [entries, setEntries] = useState<Array<{ key: string; value: string }>>([{ key: 'followers', value: '' }])
  const [ingestMsg, setIngestMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  function resetIngest() {
    setStep(1)
    setEntries([{ key: PLATFORM_KEY_METRIC[selectedPlatform] ?? 'followers', value: '' }])
    setSnapshotDate(new Date().toISOString().slice(0, 10))
    setCountryCode('')
    setSource('manual')
    setIngestMsg(null)
  }

  function openIngest(platform?: string) {
    const p = platform ?? AUDIENCE_PLATFORM_OPTIONS[0]?.value ?? 'instagram'
    setSelectedPlatform(p)
    setEntries([{ key: PLATFORM_KEY_METRIC[p] ?? 'followers', value: '' }])
    setStep(platform ? 2 : 1)
    setIngestMsg(null)
    setShowIngestModal(true)
  }

  function addEntry() {
    setEntries((prev) => [...prev, { key: 'reach', value: '' }])
  }
  function removeEntry(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i))
  }
  function setEntryKey(i: number, key: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, key } : e))
  }
  function setEntryValue(i: number, value: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, value } : e))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validEntries = entries.filter((e) => e.value.trim() !== '' && e.key.trim() !== '')
    if (validEntries.length === 0) {
      setIngestMsg({ type: 'err', text: 'Saisissez au moins une valeur.' })
      return
    }
    setIngestMsg(null)
    startTransition(async () => {
      try {
        for (const entry of validEntries) {
          const mk = entry.key === 'custom' ? metricKeyCustom.trim() : entry.key
          if (!mk) continue
          await ingestAudienceMetric({
            platform: selectedPlatform,
            metric_key: mk,
            snapshot_date: snapshotDate,
            country_code: countryCode.trim() || null,
            value_numeric: Number(entry.value),
            source,
          })
        }
        setIngestMsg({ type: 'ok', text: `${validEntries.length} point(s) enregistré(s) ✓` })
        setTimeout(() => { setShowIngestModal(false); resetIngest() }, 1200)
      } catch {
        setIngestMsg({ type: 'err', text: 'Erreur API — vérifiez les champs.' })
      }
    })
  }

  const platformInfo = (platform: string) =>
    AUDIENCE_PLATFORM_OPTIONS.find((p) => p.value === platform)

  const relevantMetrics = (platform: string) => {
    const keys = PLATFORM_RELEVANT_METRICS[platform] ?? ['followers', 'reach', 'impressions']
    return AUDIENCE_METRIC_KEY_OPTIONS.filter((o) => o.value === 'custom' || keys.includes(o.value))
  }

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Action bar ── */}
      {canIngest && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-lg">
            Tableau de bord des indicateurs réseaux sociaux & site. Chaque plateforme affiche sa métrique principale avec la tendance 7 jours.
          </p>
          <Button type="button" onClick={() => openIngest()} className="gap-2 shrink-0">
            <IconPlus className="h-4 w-4" />
            Saisir des KPIs
          </Button>
        </div>
      )}

      {/* ── Platform cards grid ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {platformSummaries.map((ps) => {
          const info = platformInfo(ps.platform)
          const isActive = activePlatform === ps.platform
          const hasData = ps.latestValue !== null
          const deltaPositive = ps.delta7d !== null && ps.delta7d > 0
          const deltaNegative = ps.delta7d !== null && ps.delta7d < 0

          return (
            <div
              key={ps.platform}
              className={`rounded-2xl border transition-all cursor-pointer select-none ${
                isActive
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
              } ${!hasData ? 'opacity-60' : ''}`}
              onClick={() => setActivePlatform(isActive ? null : ps.platform)}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl" role="img" aria-label={info?.label}>{info?.emoji ?? '📊'}</span>
                    <span className="font-semibold text-sm">{info?.label ?? ps.platform}</span>
                  </div>
                  {canIngest && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openIngest(ps.platform) }}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Saisir un KPI"
                    >
                      <IconPlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Main value */}
                {hasData ? (
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-2xl font-black tracking-tight" style={{ color: info?.color ?? 'var(--primary)' }}>
                        {fmtNum(ps.latestValue!)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{metricLabel(ps.keyMetric)}</p>
                    </div>
                    <Sparkline values={ps.sparkValues} color={info?.color ?? '#b70100'} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune donnée</p>
                )}

                {/* Delta */}
                {ps.delta7d !== null && (
                  <div className="flex items-center gap-1.5">
                    {deltaPositive ? (
                      <IconTrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : deltaNegative ? (
                      <IconTrendingDown className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <IconMinus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={`text-xs font-medium ${deltaPositive ? 'text-emerald-600' : deltaNegative ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {deltaPositive ? '+' : ''}{(ps.delta7d * 100).toFixed(1)}% / 7j
                    </span>
                  </div>
                )}

                {ps.latestDate && (
                  <p className="text-[10px] text-muted-foreground/60">
                    Mis à jour le {new Date(ps.latestDate).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Platform drill-down ── */}
      {activePlatform && (() => {
        const ps = platformSummaries.find((p) => p.platform === activePlatform)
        const info = platformInfo(activePlatform)
        const platformLatest = latest.filter((r) => r.platform === activePlatform)
        const platformHistory = recent.filter((r) => r.platform === activePlatform)
          .slice()
          .sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date))

        return (
          <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info?.emoji}</span>
                <div>
                  <h3 className="font-bold">{info?.label}</h3>
                  <p className="text-xs text-muted-foreground">{platformLatest.length} métriques suivies</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canIngest && (
                  <Button size="sm" variant="outline" onClick={() => openIngest(activePlatform)} className="gap-1.5">
                    <IconPlus className="h-3.5 w-3.5" />
                    Saisir
                  </Button>
                )}
                <button type="button" onClick={() => setActivePlatform(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                  <IconX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="p-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformLatest.map((row) => {
                const history = platformHistory
                  .filter((r) => r.metric_key === row.metric_key)
                  .slice(0, 30)
                  .reverse()
                  .map((r) => Number(r.value_numeric))
                return (
                  <div key={`${row.platform}-${row.metric_key}`} className="rounded-xl border border-border p-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground mb-1">{metricLabel(row.metric_key)}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-lg font-bold">{fmtFull(Number(row.value_numeric))}</p>
                      {history.length > 1 && <Sparkline values={history} color={info?.color ?? '#b70100'} width={60} height={28} />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(row.snapshot_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )
              })}
              {platformLatest.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-3 py-4 text-center">
                  Aucune donnée. Cliquez sur Saisir pour ajouter des KPIs.
                </p>
              )}
            </div>

            {/* History toggle */}
            {platformHistory.length > 0 && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 w-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  {showHistory ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />}
                  Historique ({platformHistory.length} points)
                </button>
                {showHistory && (
                  <div className="px-5 pb-5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 pr-4">Date</th>
                          <th className="text-left py-2 pr-4">Métrique</th>
                          <th className="text-right py-2 pr-4">Valeur</th>
                          <th className="text-left py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformHistory.slice(0, 60).map((r) => (
                          <tr key={r.id} className="border-b border-border/50">
                            <td className="py-1.5 pr-4 text-muted-foreground">{new Date(r.snapshot_date).toLocaleDateString('fr-FR')}</td>
                            <td className="py-1.5 pr-4">{metricLabel(r.metric_key)}</td>
                            <td className="py-1.5 pr-4 text-right font-mono">{fmtFull(Number(r.value_numeric))}</td>
                            <td className="py-1.5 text-muted-foreground">{r.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* ── Ingest modal ── */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowIngestModal(false)}>
          <div
            className="w-full max-w-lg bg-card rounded-2xl shadow-xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-bold">Saisir des KPIs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step === 1 ? 'Étape 1 — Choisir la plateforme' : `Étape 2 — Valeurs pour ${platformInfo(selectedPlatform)?.label}`}
                </p>
              </div>
              <button type="button" onClick={() => setShowIngestModal(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Step 1: platform selection */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {AUDIENCE_PLATFORM_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(p.value)
                          setEntries([{ key: PLATFORM_KEY_METRIC[p.value] ?? 'followers', value: '' }])
                        }}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                          selectedPlatform === p.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="text-xl" role="img">{p.emoji}</span>
                        <span className="truncate w-full text-center">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full" onClick={() => setStep(2)}>
                    Continuer →
                  </Button>
                </div>
              )}

              {/* Step 2: metric entries */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Platform info */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                    <span className="text-xl">{platformInfo(selectedPlatform)?.emoji}</span>
                    <span className="font-semibold">{platformInfo(selectedPlatform)?.label}</span>
                    <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">
                      Changer
                    </button>
                  </div>

                  {/* Date + source row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label size="sm" className="text-muted-foreground">Date du snapshot</Label>
                      <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label size="sm" className="text-muted-foreground">Source</Label>
                      <Select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        options={AUDIENCE_SOURCE_OPTIONS}
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Optional country */}
                  <div className="space-y-1">
                    <Label size="sm" className="text-muted-foreground">Code pays (vide = global)</Label>
                    <Input
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                      placeholder="FR, CI, SN… ou vide"
                      maxLength={8}
                    />
                  </div>

                  {/* Metric entries */}
                  <div className="space-y-2">
                    <Label size="sm" className="text-muted-foreground">Valeurs à saisir</Label>
                    {entries.map((entry, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Select
                          value={entry.key}
                          onChange={(e) => setEntryKey(i, e.target.value)}
                          options={relevantMetrics(selectedPlatform)}
                          className="h-10 flex-1"
                        />
                        <Input
                          value={entry.value}
                          onChange={(e) => setEntryValue(i, e.target.value)}
                          placeholder="Valeur"
                          inputMode="decimal"
                          className="w-28"
                        />
                        {entries.length > 1 && (
                          <button type="button" onClick={() => removeEntry(i)} className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive">
                            <IconX className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addEntry} className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80">
                      <IconPlus className="h-3 w-3" />
                      Ajouter une autre métrique
                    </button>
                  </div>

                  {ingestMsg && (
                    <p className={`text-sm rounded-xl px-3 py-2 ${ingestMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'}`}>
                      {ingestMsg.text}
                    </p>
                  )}

                  <Button type="submit" disabled={pending} loading={pending} className="w-full">
                    Enregistrer {entries.filter(e => e.value).length > 1 ? `${entries.filter(e => e.value).length} points` : 'le point'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Global summary table (collapsed by default) ── */}
      {latest.length > 0 && (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
            <h3 className="text-sm font-semibold">Toutes les dernières valeurs</h3>
            <span className="text-xs text-muted-foreground">{latest.length} combinaisons plateforme × métrique</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10 text-xs text-muted-foreground">
                  <th className="text-left px-4 py-3">Plateforme</th>
                  <th className="text-left px-4 py-3">Métrique</th>
                  <th className="text-right px-4 py-3">Valeur</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Pays</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((r, i) => {
                  const info = platformInfo(r.platform)
                  return (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2">
                          <span>{info?.emoji ?? '📊'}</span>
                          <span className="font-medium">{info?.label ?? r.platform}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{metricLabel(r.metric_key)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {fmtFull(Number(r.value_numeric))}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(r.snapshot_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.country_code ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
