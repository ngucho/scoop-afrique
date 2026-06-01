'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from 'scoop'
import { Link2, Copy, Check, X } from 'lucide-react'

export function DevisActions({
  devisId,
  status,
}: {
  devisId: string
  status: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [converting, setConverting] = useState(false)
  const [signLink, setSignLink] = useState<string | null>(null)
  const [loadingSignLink, setLoadingSignLink] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSend() {
    setSending(true)
    const res = await fetch(`/api/crm/devis/${devisId}/send`, {
      method: 'POST',
      credentials: 'include',
    })
    setSending(false)
    if (res.ok) {
      toast.success('Devis envoyé')
      router.refresh()
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
    }
  }

  async function handleConvert() {
    setConverting(true)
    const res = await fetch(`/api/crm/devis/${devisId}/convert`, {
      method: 'POST',
      credentials: 'include',
    })
    setConverting(false)
    if (res.ok) {
      const json = await res.json()
      const projectId = json.project?.id as string | undefined
      toast.success(projectId ? 'Devis accepté — projet créé' : 'Devis converti en projet')
      if (projectId) {
        router.push(`/projects/${projectId}`)
      } else {
        router.refresh()
      }
    } else {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur')
    }
  }

  function handlePdf() {
    window.open(`/api/crm/devis/${devisId}/pdf`, '_blank')
  }

  async function handleGenerateSignLink() {
    setLoadingSignLink(true)
    const res = await fetch(`/api/crm/devis/${devisId}/sign-token`, {
      method: 'POST',
      credentials: 'include',
    })
    setLoadingSignLink(false)
    if (!res.ok) {
      const json = await res.json()
      toast.error(json.error ?? 'Erreur lors de la génération du lien')
      return
    }
    const json = await res.json()
    const token = json.data?.token as string
    const url = `${window.location.origin}/devis/sign/${token}`
    setSignLink(url)
  }

  async function copyLink() {
    if (!signLink) return
    await navigator.clipboard.writeText(signLink)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap gap-2 items-start">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePdf}>
          PDF
        </Button>
        {(status === 'draft' || status === 'sent') && (
          <Button size="sm" onClick={handleSend} disabled={sending}>
            {sending ? 'Envoi…' : 'Envoyer'}
          </Button>
        )}
        {status === 'sent' && (
          <Button size="sm" variant="secondary" onClick={handleConvert} disabled={converting}>
            {converting ? 'Conversion…' : 'Convertir en projet'}
          </Button>
        )}
        {(status === 'draft' || status === 'sent') && !signLink && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateSignLink}
            disabled={loadingSignLink}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            {loadingSignLink ? 'Génération…' : 'Lien de signature'}
          </Button>
        )}
      </div>

      {/* Sign link panel */}
      {signLink && (
        <div className="w-full mt-2 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
          <Link2 className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground flex-1 truncate font-mono">{signLink}</span>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.97] shrink-0"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button
            type="button"
            onClick={() => setSignLink(null)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            title="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
