'use client'

import { useCallback, useState, useTransition } from 'react'
import { Button, Card, CardContent, Input, Textarea } from 'scoop'
import { IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react'
import { updateChromeSettings } from '@/lib/admin/actions'
import type { ReaderChromeSettings } from '@/lib/api/types'
import { useFormDraftState } from '@/hooks/useFormDraft'

type Draft = { title: string; subtitle: string }

export function ChromeSettingsForm({
  initial,
  embedInModal = false,
  onSuccess,
}: {
  initial: ReaderChromeSettings | null
  embedInModal?: boolean
  onSuccess?: () => void
}) {
  const getDefaults = useCallback(
    (): Draft => ({
      title: initial?.empty_ad_title ?? '',
      subtitle: initial?.empty_ad_subtitle ?? '',
    }),
    [initial],
  )

  const [form, setForm, clearDraft] = useFormDraftState('admin:reader:chrome-empty-ad', getDefaults)
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function save(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      try {
        await updateChromeSettings({
          empty_ad_title: form.title.trim() || null,
          empty_ad_subtitle: form.subtitle.trim() || null,
        })
        clearDraft()
        if (embedInModal) {
          onSuccess?.()
        } else {
          setMsg('Enregistré. Le site reader sera mis à jour sous peu.')
        }
      } catch {
        setMsg('Erreur lors de l’enregistrement.')
      }
    })
  }

  const formBody = (
    <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Textes affichés dans les emplacements publicitaires <strong>sans création publicitaire</strong> (message
            Scoop.Afrique + CTA réseaux). Laisser vide pour les libellés par défaut. Brouillon sauvegardé localement
            jusqu’à enregistrement réussi.
          </p>
          <div>
            <label className="mb-1 block text-sm font-medium">Titre principal</label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Scoop.Afrique (défaut)"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sous-texte</label>
            <Textarea
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              rows={3}
              placeholder="Suivez-nous sur les réseaux… (défaut)"
            />
          </div>
          {msg ? (
            <p
              className={`text-sm ${msg.includes('Erreur') ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {msg}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending} className="inline-flex items-center gap-2">
              {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconDeviceFloppy className="h-4 w-4" />}
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={clearDraft}>
              Réinitialiser le brouillon
            </Button>
          </div>
        </form>
  )

  if (embedInModal) return formBody

  return (
    <Card>
      <CardContent className="p-6">{formBody}</CardContent>
    </Card>
  )
}
