'use client'

import { useEffect, useState } from 'react'
import { Button, Dialog, Input, Label } from 'scoop'
import { FileSpreadsheet } from 'lucide-react'
import {
  buildProfessionalAuditBilanHtml,
  type BilanAuditApi,
} from '@/lib/audit-bilan-print-html'

const COMPANY_NAME =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CRM_COMPANY_NAME
    ? process.env.NEXT_PUBLIC_CRM_COMPANY_NAME
    : ''

export function ExportBilanDialog({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string
  defaultTo: string
}) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setFrom(defaultFrom)
    setTo(defaultTo)
  }, [defaultFrom, defaultTo])

  async function runExport() {
    setErr('')
    setLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('from', from)
      q.set('to', to)
      q.set('months', '24')
      const res = await fetch(`/api/crm/reports/financial/bilan?${q.toString()}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErr((j as { error?: string }).error ?? `Erreur ${res.status}`)
        return
      }
      const json = (await res.json()) as { data: BilanAuditApi }
      const html = buildProfessionalAuditBilanHtml(json.data, COMPANY_NAME)
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
        w.focus()
        w.print()
      }
    } catch {
      setErr('Impossible de générer le bilan.')
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2 rounded-full border-border"
        onClick={() => setOpen(true)}
      >
        <FileSpreadsheet className="h-4 w-4" />
        État financier (PDF)
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="État financier (dossier banque / actionnaires)"
        className="max-w-md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={loading || !from || !to || from > to}
              onClick={runExport}
            >
              {loading ? 'Génération…' : 'Générer (impression / PDF)'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Période d’analyse : le PDF est produit via la fenêtre d’impression. Le document inclut indicateurs,
            compte de résultat simplifié (encaissements), flux trésorerie, créances, concentration client et
            mentions pour usage bancaire (non certifié — voir bas de page).
            {COMPANY_NAME ? (
              <span className="mt-2 block text-foreground">
                Raison sociale : <strong>{COMPANY_NAME}</strong>
              </span>
            ) : (
              <span className="mt-2 block text-amber-700 dark:text-amber-500">
                Définissez <code className="rounded bg-muted px-1">NEXT_PUBLIC_CRM_COMPANY_NAME</code> dans
                l’environnement pour afficher le nom légal en en-tête.
              </span>
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bilan-from">Du</Label>
              <Input
                id="bilan-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bilan-to">Au</Label>
              <Input
                id="bilan-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
      </Dialog>
    </>
  )
}
