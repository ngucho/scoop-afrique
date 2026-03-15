'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'scoop'

export function ContractActions({
  contractId,
  status,
}: {
  contractId: string
  status: string
}) {
  const router = useRouter()
  const [signing, setSigning] = useState(false)

  async function handleSign() {
    if (!confirm('Marquer ce contrat comme signé ?')) return
    setSigning(true)
    const res = await fetch(`/api/crm/contracts/${contractId}/sign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    })
    setSigning(false)
    if (res.ok) router.refresh()
    else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  function handlePdf() {
    window.open(`/api/crm/contracts/${contractId}/pdf`, '_blank')
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handlePdf}>
        PDF
      </Button>
      {(status === 'draft' || status === 'sent') && (
        <Button size="sm" onClick={handleSign} disabled={signing}>
          {signing ? 'Enregistrement…' : 'Marquer signé'}
        </Button>
      )}
    </div>
  )
}
