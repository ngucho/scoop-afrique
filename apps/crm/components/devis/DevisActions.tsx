'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'scoop'

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

  async function handleSend() {
    setSending(true)
    const res = await fetch(`/api/crm/devis/${devisId}/send`, {
      method: 'POST',
      credentials: 'include',
    })
    setSending(false)
    if (res.ok) router.refresh()
    else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  async function handleConvert() {
    setConverting(true)
    const res = await fetch(`/api/crm/devis/${devisId}/convert`, {
      method: 'POST',
      credentials: 'include',
    })
    setConverting(false)
    if (res.ok) router.refresh()
    else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  function handlePdf() {
    window.open(`/api/crm/devis/${devisId}/pdf`, '_blank')
  }

  return (
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
    </div>
  )
}
