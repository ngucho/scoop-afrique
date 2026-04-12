'use client'

import { useState, useTransition } from 'react'
import {
  Button,
  Card,
  CardContent,
  Heading,
  Input,
  Label,
  AdminTable,
  Dialog,
  Select,
} from 'scoop'
import { IconPlus } from '@tabler/icons-react'
import type { AudienceMetricLatestRow, AudienceMetricSnapshot } from '@/lib/api/types'
import { ingestAudienceMetric } from '@/lib/admin/actions'
import { hasMinRole, type AppRole } from '@/lib/admin/rbac'
import {
  AUDIENCE_METRIC_KEY_OPTIONS,
  AUDIENCE_PLATFORM_OPTIONS,
  AUDIENCE_SOURCE_OPTIONS,
} from '@/lib/admin/audienceMetricOptions'

const DIALOG_CLASS = 'max-w-xl w-full max-h-[90vh] overflow-y-auto'

const CUSTOM_METRIC = 'custom'

export function AudienceMetricsClient({
  recent,
  latest,
  userRole,
}: {
  recent: AudienceMetricSnapshot[]
  latest: AudienceMetricLatestRow[]
  userRole: AppRole
}) {
  const canIngest = hasMinRole(userRole, 'editor')
  const [ingestOpen, setIngestOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [platform, setPlatform] = useState(AUDIENCE_PLATFORM_OPTIONS[0]?.value ?? 'instagram')
  const [metricKeySelect, setMetricKeySelect] = useState(
    AUDIENCE_METRIC_KEY_OPTIONS.find((o) => o.value !== CUSTOM_METRIC)?.value ?? 'followers',
  )
  const [metricKeyCustom, setMetricKeyCustom] = useState('')
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [countryCode, setCountryCode] = useState('')
  const [valueNumeric, setValueNumeric] = useState('')
  const [source, setSource] = useState(AUDIENCE_SOURCE_OPTIONS[0]?.value ?? 'manual')
  const [msg, setMsg] = useState<string | null>(null)

  function resolvedMetricKey(): string {
    if (metricKeySelect === CUSTOM_METRIC) return metricKeyCustom.trim()
    return metricKeySelect
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const mk = resolvedMetricKey()
    if (!platform.trim() || !mk || !snapshotDate || valueNumeric.trim() === '') {
      setMsg('Plateforme, clé métrique, date et valeur sont requis.')
      return
    }
    startTransition(async () => {
      try {
        await ingestAudienceMetric({
          platform: platform.trim(),
          metric_key: mk,
          snapshot_date: snapshotDate,
          country_code: countryCode.trim() || null,
          value_numeric: Number(valueNumeric),
          source: source.trim() || 'manual',
        })
        setMsg('Point enregistré.')
        setValueNumeric('')
        setIngestOpen(false)
      } catch {
        setMsg('Erreur API — vérifiez les champs et vos droits.')
      }
    })
  }

  const ingestForm = (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label size="sm" className="text-muted-foreground">
          Plateforme
        </Label>
        <Select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          options={AUDIENCE_PLATFORM_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          className="h-10"
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label size="sm" className="text-muted-foreground">
          Clé métrique
        </Label>
        <Select
          value={metricKeySelect}
          onChange={(e) => setMetricKeySelect(e.target.value)}
          options={AUDIENCE_METRIC_KEY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          className="h-10"
        />
        {metricKeySelect === CUSTOM_METRIC ? (
          <Input
            className="mt-2"
            value={metricKeyCustom}
            onChange={(e) => setMetricKeyCustom(e.target.value.replace(/\s+/g, '_').toLowerCase())}
            placeholder="ex. story_views (snake_case)"
          />
        ) : null}
      </div>
      <div className="space-y-1">
        <Label size="sm" className="text-muted-foreground">
          Date du snapshot
        </Label>
        <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label size="sm" className="text-muted-foreground">
          Source
        </Label>
        <Select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          options={AUDIENCE_SOURCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          className="h-10"
        />
      </div>
      <div className="space-y-1">
        <Label size="sm" className="text-muted-foreground">
          Code pays (optionnel)
        </Label>
        <Input
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
          placeholder="FR ou vide"
          maxLength={8}
        />
      </div>
      <div className="space-y-1">
        <Label size="sm" className="text-muted-foreground">
          Valeur numérique
        </Label>
        <Input
          value={valueNumeric}
          onChange={(e) => setValueNumeric(e.target.value)}
          placeholder="125000"
          inputMode="decimal"
        />
      </div>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending} loading={pending} className="rounded-lg">
          Enregistrer le point
        </Button>
      </div>
      {msg ? <p className="sm:col-span-2 text-sm text-muted-foreground">{msg}</p> : null}
    </form>
  )

  return (
    <div className="space-y-8">
      {canIngest ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Saisie guidée (listes) pour limiter les fautes de frappe. Les valeurs existantes en base ne modifient pas les
            listes : utilisez « Autre (saisie libre) » pour une clé métrique non listée.
          </p>
          <Button
            type="button"
            onClick={() => {
              setMsg(null)
              setIngestOpen(true)
            }}
            className="gap-2 rounded-lg shrink-0"
          >
            <IconPlus className="h-4 w-4" aria-hidden />
            Saisir un KPI
          </Button>
          <Dialog
            open={ingestOpen}
            onOpenChange={setIngestOpen}
            title="Saisir un point KPI"
            description="Audience et réseaux sociaux"
            className={DIALOG_CLASS}
          >
            <p className="mb-3 text-sm text-muted-foreground">
              Une ligne par date ; même combinaison plateforme + clé + date + pays est remplacée (upsert).
            </p>
            {ingestForm}
          </Dialog>
        </div>
      ) : null}

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Dernières valeurs par (plateforme × métrique)
        </Heading>
        <Card>
          <CardContent className="p-4">
            <AdminTable
              columns={[
                { label: 'Plateforme' },
                { label: 'Métrique' },
                { label: 'Date' },
                { label: 'Valeur' },
                { label: 'Pays' },
              ]}
              rows={latest.map((r) => [
                <span className="font-mono text-xs">{r.platform}</span>,
                <span className="font-mono text-xs">{r.metric_key}</span>,
                r.snapshot_date,
                Number(r.value_numeric).toLocaleString('fr-FR'),
                r.country_code ?? '—',
              ])}
              emptyMessage="Aucune donnée. Saisissez un point ou lancez un job d’ingestion."
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Heading as="h2" level="h4" className="mb-3">
          Historique récent (90 j.)
        </Heading>
        <Card>
          <CardContent className="p-4">
            <AdminTable
              columns={[
                { label: 'Créé' },
                { label: 'Plateforme' },
                { label: 'Métrique' },
                { label: 'Date' },
                { label: 'Valeur' },
                { label: 'Source' },
              ]}
              rows={recent.slice(0, 80).map((r) => [
                new Date(r.created_at).toLocaleString('fr-FR'),
                <span className="font-mono text-xs">{r.platform}</span>,
                <span className="font-mono text-xs">{r.metric_key}</span>,
                r.snapshot_date,
                Number(r.value_numeric).toLocaleString('fr-FR'),
                r.source,
              ])}
              emptyMessage="Aucun enregistrement sur la période."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
