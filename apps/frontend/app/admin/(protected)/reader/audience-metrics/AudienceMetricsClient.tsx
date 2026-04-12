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
} from 'scoop'
import type { AudienceMetricLatestRow, AudienceMetricSnapshot } from '@/lib/api/types'
import { ingestAudienceMetric } from '@/lib/admin/actions'
import { hasMinRole, type AppRole } from '@/lib/admin/rbac'

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
  const [pending, startTransition] = useTransition()
  const [platform, setPlatform] = useState('instagram')
  const [metricKey, setMetricKey] = useState('followers')
  const [snapshotDate, setSnapshotDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [countryCode, setCountryCode] = useState('')
  const [valueNumeric, setValueNumeric] = useState('')
  const [source, setSource] = useState('manual')
  const [msg, setMsg] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!platform.trim() || !metricKey.trim() || !snapshotDate || valueNumeric.trim() === '') {
      setMsg('Plateforme, clé, date et valeur sont requis.')
      return
    }
    startTransition(async () => {
      try {
        await ingestAudienceMetric({
          platform: platform.trim(),
          metric_key: metricKey.trim(),
          snapshot_date: snapshotDate,
          country_code: countryCode.trim() || null,
          value_numeric: valueNumeric.includes('.') ? Number(valueNumeric) : Number(valueNumeric),
          source: source.trim() || 'manual',
        })
        setMsg('Point enregistré (upsert par plateforme + clé + date + pays).')
      } catch {
        setMsg('Erreur API — vérifiez les champs (date AAAA-MM-JJ) et vos droits.')
      }
    })
  }

  return (
    <div className="space-y-8">
      {canIngest ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <Heading as="h2" level="h4">
              Saisir un point KPI
            </Heading>
            <p className="text-sm text-muted-foreground">
              Les valeurs sont stockées en séries temporelles (une ligne par date). Même plateforme + clé + date + code
              pays remplace la valeur existante. Laisser le pays vide pour un total global.
            </p>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Plateforme
                </Label>
                <Input
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="instagram, site, newsletter…"
                />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Clé métrique
                </Label>
                <Input value={metricKey} onChange={(e) => setMetricKey(e.target.value)} placeholder="followers, reach…" />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Date du snapshot
                </Label>
                <Input type="date" value={snapshotDate} onChange={(e) => setSnapshotDate(e.target.value)} />
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
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Source
                </Label>
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="manual, import…" />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={pending} loading={pending} className="rounded-lg">
                  Enregistrer le point
                </Button>
              </div>
            </form>
            {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
          </CardContent>
        </Card>
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
              emptyMessage="Aucune donnée. Saisissez un point ci-dessus ou lancez un job d’ingestion."
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
