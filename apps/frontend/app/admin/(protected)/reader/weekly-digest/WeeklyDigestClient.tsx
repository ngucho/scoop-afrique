'use client'

import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent } from 'scoop'
import { IconLoader2, IconRefresh } from '@tabler/icons-react'
import type { DigestArticlePickRow } from '@/lib/api/types'
import { previewWeeklyNewsletterDigest, sendWeeklyNewsletterDigest } from '@/lib/admin/actions'

export function WeeklyDigestClient() {
  const [articles, setArticles] = useState<DigestArticlePickRow[] | null>(null)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const loadPreview = useCallback(() => {
    setLastResult(null)
    startTransition(async () => {
      try {
        const data = await previewWeeklyNewsletterDigest()
        setArticles(data)
      } catch {
        setLastResult('Erreur lors du chargement de l’aperçu.')
      }
    })
  }, [])

  const runSend = useCallback((dryRun: boolean) => {
    const msg = dryRun
      ? 'Simulation uniquement : aucun e-mail ne sera envoyé. Continuer ?'
      : 'Envoyer le digest à tous les abonnés confirmés ? Cette action est immédiate.'
    if (typeof window !== 'undefined' && !window.confirm(msg)) return
    setLastResult(null)
    startTransition(async () => {
      try {
        const r = await sendWeeklyNewsletterDigest(dryRun)
        setLastResult(
          dryRun
            ? `Simulation : ${r.recipientsSent} destinataire(s) (sans envoi réel), ${r.articleIds.length} article(s) dans le corps.`
            : `Envoi terminé : ${r.recipientsSent} envoyé(s), ${r.recipientsFailed} échec(s), sur ${r.recipientsAttempted} abonné(s) confirmé(s).` +
                (r.error ? ` Dernière erreur : ${r.error}` : ''),
        )
      } catch {
        setLastResult('Erreur lors de l’envoi.')
      }
    })
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-muted-foreground">
            Le digest utilise la <strong className="text-foreground">même sélection automatique</strong> que le
            fil lecteur (actualité + popularité + signaux éditoriaux). Les destinataires sont les inscrits à la
            newsletter avec statut <strong className="text-foreground">confirmé</strong> (double opt-in).
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={loadPreview} disabled={pending}>
              {pending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconRefresh className="h-4 w-4" />}
              Actualiser l’aperçu
            </Button>
            <Button type="button" variant="secondary" onClick={() => runSend(true)} disabled={pending}>
              Simulation (dry-run)
            </Button>
            <Button type="button" className="gap-2" onClick={() => runSend(false)} disabled={pending}>
              Envoyer maintenant
            </Button>
          </div>
          {lastResult ? (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{lastResult}</p>
          ) : null}
        </CardContent>
      </Card>

      {articles && articles.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Aperçu des articles (ordre d’envoi)</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {articles.map((a) => (
                <li key={a.id} className="text-muted-foreground">
                  <Link
                    href={`/articles/${a.slug}`}
                    className="font-medium text-foreground hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {a.title}
                  </Link>
                  {a.category_slug ? (
                    <span className="ml-2 text-xs uppercase tracking-wide text-primary">{a.category_slug}</span>
                  ) : null}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : articles && articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun article publié à inclure.</p>
      ) : null}
    </div>
  )
}
