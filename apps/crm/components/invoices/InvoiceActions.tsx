'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'scoop'

export function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string
  status: string
}) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  async function handleSend() {
    setSending(true)
    const res = await fetch(`/api/crm/invoices/${invoiceId}/send`, {
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

  function handlePdf() {
    window.open(`/api/crm/invoices/${invoiceId}/pdf`, '_blank')
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
    </div>
  )
}
