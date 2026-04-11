'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  Input,
  Textarea,
  Button,
  Label,
  Select,
  Checkbox,
  AdminFormSection,
} from 'scoop'
import type { HomepageSection } from '@/lib/api/types'
import { updateHomepageSection } from '@/lib/admin/actions'
import { Info, Loader2 } from 'lucide-react'

const SECTION_HELP: Record<string, string> = {
  top_stories:
    'Bloc « à la une » : premier article en hero. Désactiver masque tout le hero.',
  latest: 'Grille des derniers articles. `max_items` limite le nombre de cartes.',
  trending: 'Articles triés par vues (`sort: views` dans le JSON avancé).',
  video: 'Section carrousel ; utilisez le JSON pour un filtre par tag (ex. `"tag":"video"`).',
  editors: 'Sélection courte type « rédaction ».',
  rubriques: 'Bandes par rubrique (ordre des catégories reader). `max_per_strip` par rubrique.',
  partnership_strip:
    'Bandeau au-dessus du footer sur tout le site lecteur (www), avec CTA vers brands.scoop-afrique.com. N’alimente pas la page d’accueil : uniquement on/off + texte d’aide ci-dessous.',
}

function numOrEmpty(v: string): number | undefined {
  if (v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

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
  const [sortOrder, setSortOrder] = useState(String(section.sort_order))
  const [visible, setVisible] = useState(section.is_visible)
  const cfg = (section.config ?? {}) as Record<string, unknown>
  const [maxItems, setMaxItems] = useState(
    typeof cfg.max_items === 'number' ? String(cfg.max_items) : typeof cfg.max_items === 'string' ? cfg.max_items : '',
  )
  const [maxPerStrip, setMaxPerStrip] = useState(
    typeof cfg.max_per_strip === 'number'
      ? String(cfg.max_per_strip)
      : typeof cfg.max_per_strip === 'string'
        ? cfg.max_per_strip
        : '',
  )
  const [tagFilter, setTagFilter] = useState(typeof cfg.tag === 'string' ? cfg.tag : '')
  const [configJson, setConfigJson] = useState(JSON.stringify(section.config ?? {}, null, 2))

  function save() {
    let baseConfig: Record<string, unknown>
    try {
      baseConfig = JSON.parse(configJson) as Record<string, unknown>
    } catch {
      alert('JSON de configuration invalide.')
      return
    }
    const merged: Record<string, unknown> = { ...baseConfig }
    const mi = numOrEmpty(maxItems)
    if (mi !== undefined) merged.max_items = mi
    else delete merged.max_items
    const mps = numOrEmpty(maxPerStrip)
    if (mps !== undefined) merged.max_per_strip = mps
    else delete merged.max_per_strip
    if (tagFilter.trim()) merged.tag = tagFilter.trim()
    else delete merged.tag

    startTransition(async () => {
      try {
        await updateHomepageSection(section.id, {
          title: title.trim(),
          layout,
          sort_order: Number(sortOrder) || 0,
          is_visible: visible,
          config: merged,
        })
      } catch {
        alert('Erreur.')
      }
    })
  }

  const help = SECTION_HELP[section.key] ?? 'Paramètres d’affichage pour cette zone de la page d’accueil publique.'

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{section.key}</p>
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(section.updated_at).toLocaleString('fr-FR')}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            Visible sur le site
          </label>
        </div>

        <div className="flex gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{help}</p>
        </div>

        <AdminFormSection title="Réglages principaux" className="border-0 bg-transparent p-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label size="sm" className="text-muted-foreground">
                Titre affiché
              </Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Disposition
              </Label>
              <Select
                value={layout}
                onChange={(e) => setLayout(e.target.value as HomepageSection['layout'])}
                className="h-10"
                options={Object.entries(layoutLabels).map(([k, v]) => ({ value: k, label: v }))}
              />
            </div>
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                Ordre d’affichage
              </Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Paramètres fréquents" description="Fusionnés dans le JSON de configuration." className="border-dashed">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label size="sm" className="text-muted-foreground">
                max_items
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="ex. 10"
                value={maxItems}
                onChange={(e) => setMaxItems(e.target.value)}
              />
            </div>
            {section.key === 'rubriques' ? (
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  max_per_strip
                </Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="ex. 2"
                  value={maxPerStrip}
                  onChange={(e) => setMaxPerStrip(e.target.value)}
                />
              </div>
            ) : null}
            {section.key === 'video' ? (
              <div className="space-y-1 sm:col-span-2">
                <Label size="sm" className="text-muted-foreground">
                  Filtre tag (vidéo)
                </Label>
                <Input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="video" />
              </div>
            ) : null}
          </div>
        </AdminFormSection>

        <div className="space-y-1">
          <Label size="sm" className="text-muted-foreground">
            Configuration JSON (avancé)
          </Label>
          <Textarea value={configJson} onChange={(e) => setConfigJson(e.target.value)} rows={5} className="font-mono text-xs" />
        </div>

        <Button type="button" onClick={save} disabled={pending} className="gap-2 rounded-lg">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enregistrer (audit)
        </Button>
      </CardContent>
    </Card>
  )
}
