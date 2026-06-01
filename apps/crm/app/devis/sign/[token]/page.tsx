import type { Metadata } from 'next'
import { DevisSignClient } from '@/components/devis/DevisSignClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function fetchDevis(token: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/devis-sign/${token}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const devis = await fetchDevis(token)
  if (!devis) return { title: 'Devis introuvable' }
  return { title: `Devis ${devis.reference} — ${devis.company?.name ?? 'Scoop Afrique'}` }
}

export default async function DevisSignPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const devis = await fetchDevis(token)

  if (!devis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm">
            Ce lien de signature est invalide ou a expiré. Contactez l&apos;émetteur du devis pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  return <DevisSignClient devis={devis} token={token} />
}
