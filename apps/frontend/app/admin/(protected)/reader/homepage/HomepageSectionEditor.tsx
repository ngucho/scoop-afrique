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
import { Clock3, Eye, EyeOff, GripVertical, Info, LayoutGrid, Loader2, Pencil, Settings2 } from 'lucide-react'
import { useFormDraftState } from '@/hooks/useFormDraft'

const SECTION_HELP: Record<string, string> = {
  top_stories:
    'Bloc « à la une » : par défaut, le site choisit l’article publié le plus lu sur les dernières 48 heures. Un article manuel peut servir d’override temporaire si une urgence éditoriale l’exige.',
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
  timeframeHours: string
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
    timeframeHours:
      typeof cfg.timeframe_hours === 'number'
        ? String(cfg.timeframe_hours)
        : typeof cfg.timeframe_hours === 'string'
          ? cfg.timeframe_hours
          : section.key === 'top_stories'
            ? '48'
            : '',
    configJson: JSON.stringify(section.config ?? {}, null, 2),
  }
}

function sectionRoleLabel(key: string): string {
  if (key === 'top_stories') return 'Hero'
  if (key === 'home_ad_mid' || key === 'home_ad_bottom') return 'Publicité'
  if (key === 'rubriques') return 'Navigation'
  if (key === 'partnership_strip') return 'Partenariat'
  return 'Articles'
}

function configSummary(section: HomepageSection, form: SectionDraft): string {
  if (section.key === 'top_stories') {
    return form.featuredArticleId.trim()
      ? `Override manuel actif${form.featuredEnds ? ` jusqu’au ${new Date(form.featuredEnds).toLocaleDateString('fr-FR')}` : ''}`
      : `Auto: plus lus ${form.timeframeHours || '48'}h`
  }
  if (section.key === 'rubriques') return `${form.maxPerStrip || '2'} article(s) par rubrique`
  if (section.key === 'video') return `Tag: ${form.tagFilter || 'video'} · ${form.maxItems || '8'} item(s)`
  if (section.key === 'home_ad_mid' || section.key === 'home_ad_bottom') return 'Emplacement publicitaire'
  if (section.key === 'partnership_strip') return 'Bandeau global lecteur'
  return `${form.maxItems || 'auto'} item(s)`
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
      const hours = numOrEmpty(form.timeframeHours)
      if (hours !== undefined) merged.timeframe_hours = Math.max(1, Math.min(168, hours))
      else merged.timeframe_hours = 48
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
  const roleLabel = sectionRoleLabel(section.key)
  const summary = configSummary(section, form)

  return (
    <>
      <Card className={form.visible ? 'border-border' : 'border-dashed opacity-75'}>
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                <GripVertical className="h-3 w-3" aria-hidden />
                {form.sortOrder || section.sort_order}
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                {roleLabel}
              </span>
              <span className={form.visible ? 'inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300' : 'inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground'}>
                {form.visible ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
                {form.visible ? 'Visible' : 'Masquée'}
              </span>
            </div>
            <div className="mt-3 min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{section.key}</p>
              <p className="mt-1 truncate text-base font-semibold text-foreground">{form.title || section.title}</p>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span className="inline-flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
                {layoutLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5" aria-hidden />
                {summary}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                {new Date(section.updated_at).toLocaleString('fr-FR')}
              </span>
            </div>
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
                  <p className="text-xs font-medium text-foreground">À la une — automatique 48h, override manuel optionnel</p>
                  <div className="space-y-1">
                    <Label size="sm" className="text-muted-foreground">
                      Fenêtre de popularité automatique (heures)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={168}
                      value={form.timeframeHours}
                      onChange={(e) => setForm((f) => ({ ...f, timeframeHours: e.target.value }))}
                      placeholder="48"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommandé : 48. Le site convertit cette fenêtre en deux jours pour classer les articles les plus lus.
                    </p>
                  </div>
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
