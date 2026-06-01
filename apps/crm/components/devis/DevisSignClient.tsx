'use client'

import { useState } from 'react'

interface PaymentMethod {
  id: string
  label: string
  number?: string
  iban?: string
  instructions?: string
}

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  unit?: string
  total: number
}

interface DevisData {
  reference: string
  title: string
  status: string
  signed_at?: string
  signature_data?: string
  valid_until?: string
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  notes?: string
  contact?: { first_name?: string; last_name?: string; company?: string }
  project?: { reference?: string; title?: string }
  company: { name: string; address?: string; phone?: string; email?: string; website?: string; rccm?: string }
  payment_methods: PaymentMethod[]
}

function fmtMoney(n: number, currency: string) {
  return `${Math.round(n).toLocaleString('fr-FR')} ${currency}`
}
function fmtDate(d?: string | null) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return d }
}

export function DevisSignClient({ devis, token }: { devis: DevisData; token: string }) {
  const [signerName, setSignerName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signed, setSigned] = useState(Boolean(devis.signed_at))
  const [signedData, setSignedData] = useState<{ signed_at?: string; signature_data?: string }>({
    signed_at: devis.signed_at,
    signature_data: devis.signature_data,
  })
  const [error, setError] = useState<string | null>(null)

  const contactName = devis.contact
    ? `${devis.contact.first_name || ''} ${devis.contact.last_name || ''}`.trim()
    : ''

  async function handleSign() {
    if (!signerName.trim() || !accepted) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/public/devis-sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de la signature')
        return
      }
      setSigned(true)
      setSignedData({ signed_at: json.data.signed_at, signature_data: json.data.signature_data })
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Devis signé !</h1>
            <p className="text-gray-600 mb-6">
              Votre acceptation a bien été enregistrée pour le devis <span className="font-semibold">{devis.reference}</span>.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1 mb-6">
              <p className="text-gray-500">Référence : <span className="text-gray-800 font-medium">{devis.reference}</span></p>
              <p className="text-gray-500">Montant : <span className="text-gray-800 font-medium">{fmtMoney(devis.total, devis.currency)}</span></p>
              {signedData.signed_at && (
                <p className="text-gray-500">Signé le : <span className="text-gray-800 font-medium">{fmtDate(signedData.signed_at)}</span></p>
              )}
              {signedData.signature_data && (
                <p className="text-gray-500 text-xs italic mt-2">{signedData.signature_data}</p>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Vous recevrez une confirmation par email. Pour toute question, contactez{' '}
              <a href={`mailto:${devis.company.email}`} className="text-red-600 hover:underline">
                {devis.company.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-1.5 bg-red-600" />
          <div className="p-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">{devis.company.name}</p>
              {devis.company.address && <p className="text-xs text-gray-400">{devis.company.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-red-600">DEVIS</p>
              <p className="text-sm font-bold text-gray-800">{devis.reference}</p>
              {devis.valid_until && (
                <p className="text-xs text-gray-500 mt-0.5">Valable jusqu&apos;au {fmtDate(devis.valid_until)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2">Émetteur</p>
            <p className="font-semibold text-gray-900 text-sm">{devis.company.name}</p>
            {devis.company.phone && <p className="text-xs text-gray-500 mt-0.5">{devis.company.phone}</p>}
            {devis.company.email && <p className="text-xs text-gray-500">{devis.company.email}</p>}
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2">Destinataire</p>
            {contactName ? (
              <p className="font-semibold text-gray-900 text-sm">{contactName}</p>
            ) : (
              <p className="font-semibold text-gray-900 text-sm">{devis.title}</p>
            )}
            {devis.contact?.company && <p className="text-xs text-gray-500 mt-0.5">{devis.contact.company}</p>}
            {devis.project?.title && <p className="text-xs text-gray-400 mt-0.5">Projet : {devis.project.title}</p>}
          </div>
        </div>

        {/* Objet */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500">Objet</p>
          <p className="font-semibold text-gray-900 mt-0.5">{devis.title}</p>
        </div>

        {/* Line items table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-600 text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs">Désignation / Prestation</th>
                <th className="text-right px-4 py-3 font-semibold text-xs">Qté</th>
                <th className="text-right px-4 py-3 font-semibold text-xs">Prix unit.</th>
                <th className="text-right px-4 py-3 font-semibold text-xs">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {(devis.line_items || []).map((item, i) => (
                <tr key={i} className={i % 2 !== 0 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.description}</span>
                    {item.unit && item.unit !== 'unité' && (
                      <span className="text-xs text-gray-400 ml-1">({item.unit})</span>
                    )}
                  </td>
                  <td className="text-right px-4 py-3 text-gray-600">{item.quantity}</td>
                  <td className="text-right px-4 py-3 text-gray-600">{fmtMoney(item.unit_price, devis.currency)}</td>
                  <td className="text-right px-4 py-3 font-medium text-gray-900">{fmtMoney(item.total, devis.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-64 divide-y divide-gray-100">
                <div className="flex justify-between px-4 py-2.5 text-sm">
                  <span className="text-gray-500">Sous-total HT</span>
                  <span className="text-gray-800">{fmtMoney(devis.subtotal, devis.currency)}</span>
                </div>
                {devis.tax_amount > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-500">TVA ({devis.tax_rate}%)</span>
                    <span className="text-gray-800">{fmtMoney(devis.tax_amount, devis.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-red-600 text-white">
                  <span className="font-bold">TOTAL TTC</span>
                  <span className="font-bold">{fmtMoney(devis.total, devis.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        {devis.payment_methods.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Moyens de paiement acceptés</p>
            <div className="space-y-2">
              {devis.payment_methods.map((m) => {
                const coords = [m.iban, m.number].filter(Boolean).join(' / ')
                const detail = [coords, m.instructions].filter(Boolean).join(' — ')
                return (
                  <div key={m.id} className="flex items-start gap-3 text-sm">
                    <span className="font-semibold text-gray-900 w-32 shrink-0">{m.label}</span>
                    <span className="text-gray-500">{detail || '—'}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3 italic">
              Paiement à réception — Début de prestation après réception du paiement intégral
            </p>
          </div>
        )}

        {/* Notes */}
        {devis.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{devis.notes}</p>
          </div>
        )}

        {/* Signature form */}
        <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm overflow-hidden">
          <div className="bg-red-600 px-6 py-4">
            <h2 className="text-white font-bold text-base">Validation et signature électronique</h2>
            <p className="text-red-100 text-xs mt-0.5">
              En signant, vous acceptez les conditions du devis {devis.reference}.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nom complet <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Prénom Nom"
                className="w-full h-11 rounded-xl border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                maxLength={120}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-red-600"
              />
              <span className="text-sm text-gray-600 leading-snug">
                J&apos;ai lu et j&apos;accepte le devis <strong>{devis.reference}</strong> d&apos;un montant de{' '}
                <strong>{fmtMoney(devis.total, devis.currency)}</strong>. Je reconnais que cette validation électronique constitue une acceptation valide du devis.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSign}
              disabled={!signerName.trim() || !accepted || submitting}
              className="w-full h-12 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signature en cours…
                </span>
              ) : (
                'Valider et signer le devis'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Signature horodatée et enregistrée de manière sécurisée.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-6">
          {devis.company.name}
          {devis.company.address && ` · ${devis.company.address}`}
          {devis.company.email && (
            <> · <a href={`mailto:${devis.company.email}`} className="hover:text-gray-600">{devis.company.email}</a></>
          )}
        </div>
      </div>
    </div>
  )
}
