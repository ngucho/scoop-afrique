'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent } from 'scoop'
import { IconAlertCircle, IconCheck, IconFileUpload, IconLoader2 } from '@tabler/icons-react'
import { importArticlesFromJson } from '@/lib/admin/actions'
import type { ArticleImportResult, Category } from '@/lib/api/types'

const SAMPLE_JSON = `{
  "articles": [
    {
      "title": "Titre complet de l'article",
      "excerpt": "Un chapeau de deux lignes pour presenter l'angle.",
      "rubrique": "Politique",
      "body": "Premier paragraphe de l'article.\\n\\nDeuxieme paragraphe.",
      "tags": ["politique", "afrique"],
      "meta_title": "Titre SEO",
      "meta_description": "Description SEO"
    }
  ]
}`

export function ArticleJsonImportForm({ categories }: { categories: Category[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [jsonText, setJsonText] = useState(SAMPLE_JSON)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ArticleImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(file: File) {
    setError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => setJsonText(String(reader.result ?? ''))
    reader.onerror = () => setError('Impossible de lire ce fichier JSON.')
    reader.readAsText(file)
  }

  function handleImport() {
    setError('')
    setResult(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      setError('JSON invalide. Verifiez les virgules, guillemets et crochets.')
      return
    }

    startTransition(async () => {
      try {
        const imported = await importArticlesFromJson(parsed)
        setResult(imported)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import impossible.')
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Fichier ou collage JSON</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Le format accepte soit un tableau, soit un objet avec la cle `articles`.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <IconFileUpload className="h-4 w-4" />
              Choisir un JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) handleFile(file)
              }}
            />
          </div>

          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value)
              setError('')
              setResult(null)
            }}
            spellCheck={false}
            className="min-h-[420px] w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-primary"
          />

          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/25 dark:text-red-300">
              <IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-3 rounded-lg border border-border bg-background p-3">
              <div className="flex items-start gap-2 text-sm">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  {result.created_count} brouillon{result.created_count > 1 ? 's' : ''} cree{result.created_count > 1 ? 's' : ''}.
                </p>
              </div>
              {result.needs_category_review.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
                  <p className="font-semibold">Rubriques a renseigner manuellement</p>
                  <ul className="mt-2 space-y-1">
                    {result.needs_category_review.map((item) => (
                      <li key={`${item.index}-${item.title}`}>
                        {item.title} - rubrique proposee: {item.requested_category ?? 'non renseignee'}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <Link href="/admin/articles?status=draft" className="inline-flex text-sm font-semibold text-primary hover:underline">
                Voir les brouillons
              </Link>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || !jsonText.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 sm:w-auto"
          >
            {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconFileUpload className="h-4 w-4" />}
            Importer en brouillons
          </button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Champs reconnus</h2>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>`title`, `excerpt`, `body` ou `content`, `rubrique`, `category`, `category_slug`, `tags`.</p>
              <p>`cover_image_url`, `video_url`, `meta_title`, `meta_description` sont importes si presents.</p>
              <p>La rubrique est associee automatiquement par nom ou slug. Sinon le brouillon reste sans rubrique.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h2 className="text-sm font-semibold">Rubriques disponibles</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {category.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
