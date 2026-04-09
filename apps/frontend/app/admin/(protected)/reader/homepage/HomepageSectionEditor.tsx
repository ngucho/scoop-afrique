'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, Input, Textarea } from 'scoop'
import type { HomepageSection } from '@/lib/api/types'
import { updateHomepageSection } from '@/lib/admin/actions'
import { IconLoader2 } from '@tabler/icons-react'

export function HomepageSectionEditor({
  section,
  layoutLabels,
}: {
  section: HomepageSection
  layoutLabels: Record<string, string>
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(section.title)
  const [layout, setLayout] = useState(section.layout)
  const [sortOrder, setSortOrder] = useState(section.sort_order)
  const [visible, setVisible] = useState(section.is_visible)
  const [configJson, setConfigJson] = useState(JSON.stringify(section.config ?? {}, null, 2))

  function save() {
    let config: Record<string, unknown>
    try {
      config = JSON.parse(configJson) as Record<string, unknown>
    } catch {
      alert('JSON de configuration invalide.')
      return
    }
    startTransition(async () => {
      try {
        await updateHomepageSection(section.id, {
          title: title.trim(),
          layout,
          sort_order: sortOrder,
          is_visible: visible,
          config,
        })
      } catch {
        alert('Erreur.')
      }
    })
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{section.key}</p>
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(section.updated_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Visible sur le reader
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre affiché</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Disposition</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as HomepageSection['layout'])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(layoutLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Ordre (tri)</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Configuration (JSON) — ex. max_items, filtres
          </label>
          <Textarea
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            rows={5}
            className="font-mono text-xs"
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending && <IconLoader2 className="h-4 w-4 animate-spin" />}
          Enregistrer (audit)
        </button>
      </CardContent>
    </Card>
  )
}
