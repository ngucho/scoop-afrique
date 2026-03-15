'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from 'scoop'

export function ProjectCloseButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    if (!confirm('Clôturer ce projet ?')) return
    setLoading(true)
    const res = await fetch(`/api/crm/projects/${projectId}/close`, {
      method: 'POST',
      credentials: 'include',
    })
    setLoading(false)
    if (res.ok) router.refresh()
    else {
      const json = await res.json()
      alert(json.error ?? 'Erreur')
    }
  }

  return (
    <Button variant="outline" onClick={handleClose} disabled={loading}>
      {loading ? 'Clôture…' : 'Clôturer le projet'}
    </Button>
  )
}
