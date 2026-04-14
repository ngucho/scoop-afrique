'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  Dialog,
} from 'scoop'
import type { HomepageSection } from '@/lib/api/types'
import { updateHomepageSection } from '@/lib/admin/actions'
import { Info, Loader2, Pencil } from 'lucide-react'
import { useFormDraftState } from '@/hooks/useFormDraft'

const SECTION_HELP: Record<string, string> = {
  top_stories:
    'Bloc « à la une » : image en 16:9 fixe côté lecteur. Sans article manuel (ou hors fenêtre de dates), le hero affiche l’article le plus lu sur 7 jours (puis repli sur le classement toutes vues).',
  latest: 'Grille des derniers articles. `max_items` limite le nombre de cartes.',
  trending: 'Articles triés par vues (`sort: views` dans le JSON avancé).',
  video: 'Section carrousel ; utilisez le JSON pour un filtre par tag (ex. `"tag":"video"`).',
  editors: 'Sélection courte type « rédaction ».',
  rubriques:
    'Bandes par rubrique (ordre des catégories reader). `max_per_strip` par rubrique. Le « layout » s’applique à chaque rubrique : liste, grille ou carrousel horizontal.',
  home_ad_mid:
    'Encart publicitaire milieu de page (emplacement HOME_MID_1). Déplacez la ligne « ordre » pour le placer entre deux blocs éditoriaux. Le layout CMS est ignoré sur le site.',
  home_ad_bottom:
    'Encart publicitaire bas de page (emplacement HOME_BOTTOM). Même principe que milieu : l’ordre dans la liste définit où il apparaît. Le layout CMS est ignoré sur le site.',
  partnership_strip:
    'Bandeau au-dessus du footer sur tout le site lecteur (www), avec CTA vers brands.scoop-afrique.com. N’alimente pas la page d’accueil : uniquement on/off + texte d’aide ci-dessous.',
}

const DIALOG_CLASS = 'max-w-3xl w-full max-h-[90vh] overflow-y-auto'

function numOrEmpty(v: string): number | undefined {
  if (v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function isoToDatetimeLocalValue(iso: string | undefined): string {
  if (!iso || typeof iso !== 'string') return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type SectionDraft = {
  title: string
  layout: HomepageSection['layout']
  sortOrder: string
  visible: boolean
  maxItems: string
  maxPerStrip: string
  tagFilter: string
  featuredArticleId: string
  featuredStarts: string
  featuredEnds: string
  configJson: string
}

function buildDefaults(section: HomepageSection): SectionDraft {
  const cfg = (section.config ?? {}) as Record<string, unknown>
  return {
    title: section.title,
    layout: section.layout,
    sortOrder: String(section.sort_order),
    visible: section.is_visible,
    maxItems:
      typeof cfg.max_items === 'number'
        ? String(cfg.max_items)
        : typeof cfg.max_items === 'string'
          ? cfg.max_items
          : '',
    maxPerStrip:
      typeof cfg.max_per_strip === 'number'
        ? String(cfg.max_per_strip)
        : typeof cfg.max_per_strip === 'string'
          ? cfg.max_per_strip
          : '',
    tagFilter: typeof cfg.tag === 'string' ? cfg.tag : '',
    featuredArticleId: typeof cfg.featured_article_id === 'string' ? cfg.featured_article_id : '',
    featuredStarts: isoToDatetimeLocalValue(
      typeof cfg.featured_starts_at === 'string' ? cfg.featured_starts_at : undefined,
    ),
    featuredEnds: isoToDatetimeLocalValue(
      typeof cfg.featured_ends_at === 'string' ? cfg.featured_ends_at : undefined,
    ),
    configJson: JSON.stringify(section.config ?? {}, null, 2),
  }
}

export function HomepageSectionEditor({
  section,
  layoutLabels,
}: {
  section: HomepageSection
  layoutLabels: Record<string, string>
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const getDefaults = useCallback(() => buildDefaults(section), [section])
  const [form, setForm, clearDraft] = useFormDraftState(
    `admin:reader:homepage:v2:${section.id}`,
    getDefaults,
  )

  const syncedRef = useRef(section.updated_at)
  useEffect(() => {
    if (syncedRef.current !== section.updated_at) {
      syncedRef.current = section.updated_at
      setForm(buildDefaults(section))
    }
  }, [section, setForm])

  function save() {
    let baseConfig: Record<string, unknown>
    try {
      baseConfig = JSON.parse(form.configJson) as Record<string, unknown>
    } catch {
      alert('JSON de configuration invalide.')
      return
    }
    const merged: Record<string, unknown> = { ...baseConfig }
    const mi = numOrEmpty(form.maxItems)
    if (mi !== undefined) merged.max_items = mi
    else delete merged.max_items
    const mps = numOrEmpty(form.maxPerStrip)
    if (mps !== undefined) merged.max_per_strip = mps
    else delete merged.max_per_strip
    if (form.tagFilter.trim()) merged.tag = form.tagFilter.trim()
    else delete merged.tag

    if (section.key === 'top_stories') {
      if (form.featuredArticleId.trim()) merged.featured_article_id = form.featuredArticleId.trim()
      else delete merged.featured_article_id
      if (form.featuredStarts.trim()) {
        const iso = new Date(form.featuredStarts)
        if (!Number.isNaN(iso.getTime())) merged.featured_starts_at = iso.toISOString()
        else delete merged.featured_starts_at
      } else delete merged.featured_starts_at
      if (form.featuredEnds.trim()) {
        const iso = new Date(form.featuredEnds)
        if (!Number.isNaN(iso.getTime())) merged.featured_ends_at = iso.toISOString()
        else delete merged.featured_ends_at
      } else delete merged.featured_ends_at
    }

    startTransition(async () => {
      try {
        await updateHomepageSection(section.id, {
          title: form.title.trim(),
          layout: form.layout,
          sort_order: Number(form.sortOrder) || 0,
          is_visible: form.visible,
          config: merged,
        })
        clearDraft()
        setModalOpen(false)
        router.refresh()
      } catch {
        alert('Erreur.')
      }
    })
  }

  const help = SECTION_HELP[section.key] ?? 'Paramètres d’affichage pour cette zone de la page d’accueil publique.'
  const layoutLabel = layoutLabels[form.layout] ?? form.layout

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-xs text-muted-foreground">{section.key}</p>
            <p className="truncate font-medium text-foreground">{form.title || section.title}</p>
            <p className="text-xs text-muted-foreground">
              {layoutLabel} · ordre {form.sortOrder ?? section.sort_order}
              {' · '}
              <span className={form.visible ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                {form.visible ? 'Visible' : 'Masquée'}
              </span>
              {' · '}
              MAJ {new Date(section.updated_at).toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-muted-foreground">Brouillon local conservé dans le formulaire.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-2 rounded-lg"
            onClick={() => setModalOpen(true)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Configurer la section
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={`Section « ${section.key} »`}
        description="Réglages page d’accueil reader"
        className={DIALOG_CLASS}
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour serveur : {new Date(section.updated_at).toLocaleString('fr-FR')}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.visible}
                onChange={(e) => setForm((f) => ({ ...f, visible: e.target.checked }))}
              />
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
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Disposition
                </Label>
                <Select
                  value={form.layout}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, layout: e.target.value as HomepageSection['layout'] }))
                  }
                  className="h-10"
                  options={Object.entries(layoutLabels).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>
              <div className="space-y-1">
                <Label size="sm" className="text-muted-foreground">
                  Ordre d’affichage
                </Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Paramètres fréquents"
            description="Fusionnés dans le JSON de configuration."
            className="border-dashed"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {section.key === 'top_stories' ? (
                <div className="space-y-3 sm:col-span-2">
                  <p className="text-xs font-medium text-foreground">À la une — choix rédactionnel</p>
                  <div className="space-y-1">
                    <Label size="sm" className="text-muted-foreground">
                      ID ou slug de l&apos;article (publié)
                    </Label>
                    <Input
                      value={form.featuredArticleId}
                      onChange={(e) => setForm((f) => ({ ...f, featuredArticleId: e.target.value }))}
                      placeholder="uuid ou slug"
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label size="sm" className="text-muted-foreground">
                        Début d&apos;affichage (optionnel)
                      </Label>
                      <Input
                        type="datetime-local"
                        value={form.featuredStarts}
                        onChange={(e) => setForm((f) => ({ ...f, featuredStarts: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label size="sm" className="text-muted-foreground">
                        Fin d&apos;affichage (optionnel)
                      </Label>
                      <Input
                        type="datetime-local"
                        value={form.featuredEnds}
                        onChange={(e) => setForm((f) => ({ ...f, featuredEnds: e.target.value }))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Laisser les dates vides : l&apos;article reste « à la une » tant que l&apos;ID est renseigné. Après la
                    fin, ou sans ID : l&apos;article le plus lu sur 7 jours est utilisé automatiquement.
                  </p>
                </div>
              ) : null}
              {section.key !== 'top_stories' ? (
                <div className="space-y-1">
                  <Label size="sm" className="text-muted-foreground">
                    max_items
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="ex. 10"
                    value={form.maxItems}
                    onChange={(e) => setForm((f) => ({ ...f, maxItems: e.target.value }))}
                  />
                </div>
              ) : null}
              {section.key === 'rubriques' ? (
                <div className="space-y-1">
                  <Label size="sm" className="text-muted-foreground">
                    max_per_strip
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="ex. 2"
                    value={form.maxPerStrip}
                    onChange={(e) => setForm((f) => ({ ...f, maxPerStrip: e.target.value }))}
                  />
                </div>
              ) : null}
              {section.key === 'video' ? (
                <div className="space-y-1 sm:col-span-2">
                  <Label size="sm" className="text-muted-foreground">
                    Filtre tag (vidéo)
                  </Label>
                  <Input
                    value={form.tagFilter}
                    onChange={(e) => setForm((f) => ({ ...f, tagFilter: e.target.value }))}
                    placeholder="video"
                  />
                </div>
              ) : null}
            </div>
          </AdminFormSection>

          <div className="space-y-1">
            <Label size="sm" className="text-muted-foreground">
              Configuration JSON (avancé)
            </Label>
            <Textarea
              value={form.configJson}
              onChange={(e) => setForm((f) => ({ ...f, configJson: e.target.value }))}
              rows={5}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={pending} className="gap-2 rounded-lg">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enregistrer (audit)
            </Button>
            <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={clearDraft}>
              Réinitialiser le brouillon
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
