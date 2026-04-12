'use client'

import { useState, useTransition } from 'react'
import { Button, Card, CardContent, Input } from 'scoop'
import { IconKey, IconLoader2, IconTrash } from '@tabler/icons-react'
import { createWriterApiKey, revokeWriterApiKey } from '@/lib/admin/actions'
import type { WriterApiKeyRow } from '@/lib/api/types'
import { formatDateShort } from '@/lib/formatDate'

export function WriterApiKeysPanel({ initialKeys }: { initialKeys: WriterApiKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys)
  const [label, setLabel] = useState('')
  const [revealed, setRevealed] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function createKey() {
    startTransition(async () => {
      try {
        const lbl = label.trim() || 'Clé'
        const data = await createWriterApiKey(lbl)
        setRevealed(data.raw_key)
        setLabel('')
        setKeys((prev) => [
          {
            id: data.id,
            key_prefix: data.key_prefix,
            label: lbl,
            last_used_at: null,
            revoked_at: null,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      } catch {
        alert('Impossible de créer la clé.')
      }
    })
  }

  function revoke(id: string) {
    if (!confirm('Révoquer cette clé ? Les automatisations qui l’utilisent cesseront de fonctionner.')) return
    startTransition(async () => {
      try {
        await revokeWriterApiKey(id)
        setKeys((k) => k.filter((x) => x.id !== id))
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <div className="space-y-6">
      {revealed ? (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold text-primary">Copiez cette clé maintenant</p>
            <p className="text-xs text-muted-foreground">Elle ne sera plus affichée. Exemple : saw_…</p>
            <code className="block break-all rounded-md bg-muted p-3 text-xs">{revealed}</code>
            <Button type="button" variant="outline" size="sm" onClick={() => setRevealed(null)}>
              J’ai copié la clé
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm font-medium">Nouvelle clé</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">Libellé (optionnel)</label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Macaron LLM" />
            </div>
            <Button type="button" disabled={pending} onClick={createKey} className="inline-flex items-center gap-2">
              {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconKey className="h-4 w-4" />}
              Générer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Libellé</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Préfixe</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Créée</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dernier usage</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Aucune clé. Générez-en une pour automatiser la création de brouillons.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr key={k.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{k.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{k.key_prefix}…</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateShort(k.created_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {k.revoked_at ? (
                      <span className="text-destructive">Révoquée</span>
                    ) : k.last_used_at ? (
                      formatDateShort(k.last_used_at)
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!k.revoked_at ? (
                      <button
                        type="button"
                        title="Révoquer"
                        disabled={pending}
                        onClick={() => revoke(k.id)}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
