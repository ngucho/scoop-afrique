'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  CreditCard,
  Building2,
  Bell,
  Zap,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Landmark,
  Banknote,
  CreditCard as CardIcon,
  Wallet,
  MoreHorizontal,
} from 'lucide-react'

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

type PaymentMethodType = 'mobile_money' | 'bank' | 'card' | 'cash' | 'other'

interface PaymentMethod {
  id: string
  label: string
  type?: PaymentMethodType
  number?: string
  iban?: string
  instructions?: string
  active: boolean
  sort: number
}

const METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  mobile_money: '📱 Mobile Money',
  bank: '🏦 Virement / Compte bancaire',
  card: '💳 Carte / Portefeuille digital',
  cash: '💵 Espèces',
  other: '📋 Autre',
}

const METHOD_TYPE_ICONS: Record<PaymentMethodType, React.ElementType> = {
  mobile_money: Smartphone,
  bank: Landmark,
  card: CardIcon,
  cash: Banknote,
  other: MoreHorizontal,
}

const PRESET_METHODS: Array<{ label: string; type: PaymentMethodType; placeholder?: string }> = [
  { label: 'Wave', type: 'mobile_money', placeholder: '+225 XXXXXXXXXX' },
  { label: 'Orange Money', type: 'mobile_money', placeholder: '+225 XXXXXXXXXX' },
  { label: 'MTN Mobile Money', type: 'mobile_money', placeholder: '+225 XXXXXXXXXX' },
  { label: 'Moov Money', type: 'mobile_money', placeholder: '+225 XXXXXXXXXX' },
  { label: 'Djamo', type: 'card', placeholder: '+225 XXXXXXXXXX' },
  { label: 'YUP (Société Générale)', type: 'mobile_money', placeholder: '+225 XXXXXXXXXX' },
  { label: 'Virement bancaire (SGBCI)', type: 'bank', placeholder: 'CI XX XXXX XXXX XXXX' },
  { label: 'PayPal', type: 'card', placeholder: 'email@paypal.com' },
  { label: 'Espèces', type: 'cash' },
]

const EMPTY_NEW_METHOD: Omit<PaymentMethod, 'id' | 'sort'> = {
  label: '',
  type: 'mobile_money',
  number: '',
  iban: '',
  instructions: '',
  active: true,
}

interface CompanyInfo {
  name: string
  address: string
  email: string
  phone: string
  website: string
  siret?: string
  rccm?: string
}

interface ReminderPreferences {
  default_channel: 'email' | 'whatsapp' | 'both'
  include_payment_methods_in_reminders: boolean
  auto_send_enabled: boolean
  send_hour: number
}

interface ReminderRule {
  id: string
  name: string
  trigger_event: string
  delay_days: number
  channel: string
  message_template: string
  is_active: boolean
  sort_order: number
}

const TRIGGER_LABELS: Record<string, string> = {
  devis_sent: 'Après envoi devis',
  invoice_sent: 'Après envoi facture',
  invoice_due_soon: 'Avant échéance facture',
  invoice_overdue: 'Après retard facture',
  project_started: 'Après démarrage projet',
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  both: 'WhatsApp + Email',
}

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function SectionTab({ icon: Icon, label, active, onClick }: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 w-full text-left ${
        active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  )
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export function SettingsClient() {
  const [tab, setTab] = useState<'payment' | 'company' | 'reminders' | 'rules'>('payment')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '', address: '', email: '', phone: '', website: '',
  })
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPreferences>({
    default_channel: 'whatsapp',
    include_payment_methods_in_reminders: true,
    auto_send_enabled: false,
    send_hour: 9,
  })
  const [rules, setRules] = useState<ReminderRule[]>([])
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [addingPayment, setAddingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState<Omit<PaymentMethod, 'id' | 'sort'>>(EMPTY_NEW_METHOD)
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null)
  const [newRule, setNewRule] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    setLoading(true)
    try {
      const [settingsRes, rulesRes] = await Promise.all([
        fetch('/api/crm/settings', { credentials: 'include' }),
        fetch('/api/crm/settings/reminder-rules', { credentials: 'include' }),
      ])
      if (settingsRes.ok) {
        const json = await settingsRes.json()
        setPaymentMethods(json.data.payment_methods ?? [])
        setCompanyInfo(json.data.company_info ?? {})
        setReminderPrefs(json.data.reminder_preferences ?? {})
      }
      if (rulesRes.ok) {
        const json = await rulesRes.json()
        setRules(json.data ?? [])
      }
    } catch {
      toast.error('Erreur de chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  /* ── Payment Methods ── */
  async function savePaymentMethods() {
    setSaving(true)
    const res = await fetch('/api/crm/settings/payment-methods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methods: paymentMethods }),
      credentials: 'include',
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Moyens de paiement mis à jour')
      setEditingPaymentId(null)
    } else {
      toast.error('Erreur de sauvegarde')
    }
  }

  function togglePaymentActive(id: string) {
    setPaymentMethods((ms) => ms.map((m) => m.id === id ? { ...m, active: !m.active } : m))
  }

  function updatePaymentField(id: string, field: keyof PaymentMethod, value: unknown) {
    setPaymentMethods((ms) => ms.map((m) => m.id === id ? { ...m, [field]: value } : m))
  }

  async function deletePaymentMethod(id: string) {
    const updated = paymentMethods.filter((m) => m.id !== id).map((m, i) => ({ ...m, sort: i + 1 }))
    setPaymentMethods(updated)
    setDeletingPaymentId(null)
    setSaving(true)
    const res = await fetch('/api/crm/settings/payment-methods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methods: updated }),
      credentials: 'include',
    })
    setSaving(false)
    if (res.ok) toast.success('Moyen de paiement supprimé')
    else toast.error('Erreur de suppression')
  }

  async function addPaymentMethod() {
    if (!newPayment.label.trim()) {
      toast.error('Le nom est requis')
      return
    }
    const id = newPayment.label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_')
    const uniqueId = paymentMethods.some((m) => m.id === id) ? `${id}_${Date.now()}` : id
    const method: PaymentMethod = {
      ...newPayment,
      id: uniqueId,
      sort: paymentMethods.length + 1,
    }
    const updated = [...paymentMethods, method]
    setSaving(true)
    const res = await fetch('/api/crm/settings/payment-methods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ methods: updated }),
      credentials: 'include',
    })
    setSaving(false)
    if (res.ok) {
      setPaymentMethods(updated)
      setNewPayment(EMPTY_NEW_METHOD)
      setAddingPayment(false)
      toast.success('Moyen de paiement ajouté')
    } else {
      toast.error('Erreur d\'ajout')
    }
  }

  function movePayment(id: string, direction: 'up' | 'down') {
    const idx = paymentMethods.findIndex((m) => m.id === id)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= paymentMethods.length) return
    const updated = [...paymentMethods]
    const temp = updated[idx]!
    updated[idx] = { ...updated[newIdx]!, sort: idx + 1 }
    updated[newIdx] = { ...temp, sort: newIdx + 1 }
    setPaymentMethods(updated)
  }

  /* ── Company Info ── */
  async function saveCompanyInfo() {
    setSaving(true)
    const res = await fetch('/api/crm/settings/company-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyInfo),
      credentials: 'include',
    })
    setSaving(false)
    if (res.ok) toast.success('Informations entreprise mises à jour')
    else toast.error('Erreur de sauvegarde')
  }

  /* ── Reminder Preferences ── */
  async function saveReminderPrefs() {
    setSaving(true)
    const res = await fetch('/api/crm/settings/reminder-preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminderPrefs),
      credentials: 'include',
    })
    setSaving(false)
    if (res.ok) toast.success('Préférences de relance mises à jour')
    else toast.error('Erreur de sauvegarde')
  }

  /* ── Reminder Rules ── */
  async function saveRule(rule: ReminderRule) {
    const isNew = !rules.find((r) => r.id === rule.id)
    const url = isNew ? '/api/crm/settings/reminder-rules' : `/api/crm/settings/reminder-rules/${rule.id}`
    const method = isNew ? 'POST' : 'PATCH'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
      credentials: 'include',
    })
    if (res.ok) {
      toast.success(isNew ? 'Règle créée' : 'Règle mise à jour')
      setEditingRule(null)
      setNewRule(false)
      await loadSettings()
    } else {
      toast.error('Erreur')
    }
  }

  async function deleteRule(id: string) {
    const res = await fetch(`/api/crm/settings/reminder-rules/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      toast.success('Règle supprimée')
      setRules((rs) => rs.filter((r) => r.id !== id))
    }
  }

  async function toggleRuleActive(rule: ReminderRule) {
    await fetch(`/api/crm/settings/reminder-rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
      credentials: 'include',
    })
    setRules((rs) => rs.map((r) => r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Chargement des paramètres…</span>
      </div>
    )
  }

  return (
    <div className="flex gap-8 max-w-[1100px]">
      {/* Sidebar navigation */}
      <aside className="w-52 shrink-0 space-y-1">
        <SectionTab icon={CreditCard} label="Moyens de paiement" active={tab === 'payment'} onClick={() => setTab('payment')} />
        <SectionTab icon={Building2} label="Entreprise" active={tab === 'company'} onClick={() => setTab('company')} />
        <SectionTab icon={Bell} label="Préférences relances" active={tab === 'reminders'} onClick={() => setTab('reminders')} />
        <SectionTab icon={Zap} label="Règles automatiques" active={tab === 'rules'} onClick={() => setTab('rules')} />
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">

        {/* ── Payment Methods ── */}
        {tab === 'payment' && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Moyens de paiement</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configurez les moyens de paiement acceptés. Ils apparaîtront dans les devis, factures et messages de relance.
                  Vous pouvez ajouter Wave, Orange Money, MTN MoMo, Moov Money, Djamo, virement bancaire, ou tout autre moyen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setAddingPayment(true); setNewPayment(EMPTY_NEW_METHOD) }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>

            {/* Add new payment method form */}
            {addingPayment && (
              <div className="crm-card p-5 border-2 border-primary/20 space-y-4">
                <p className="text-sm font-semibold text-foreground">Nouveau moyen de paiement</p>

                {/* Quick presets */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sélectionner un preset :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_METHODS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewPayment((p) => ({ ...p, label: preset.label, type: preset.type }))}
                        className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                          newPayment.label === preset.label
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border hover:border-primary/40 text-muted-foreground'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Nom affiché <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPayment.label}
                      onChange={(e) => setNewPayment((p) => ({ ...p, label: e.target.value }))}
                      placeholder="Ex: Wave, Djamo, SGBCI…"
                      autoFocus
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                    <select
                      value={newPayment.type ?? 'mobile_money'}
                      onChange={(e) => setNewPayment((p) => ({ ...p, type: e.target.value as PaymentMethodType }))}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {(Object.entries(METHOD_TYPE_LABELS) as [PaymentMethodType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  {(newPayment.type === 'mobile_money' || newPayment.type === 'card') && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        <Smartphone className="inline h-3 w-3 mr-1" />
                        Numéro / Identifiant
                      </label>
                      <input
                        type="text"
                        value={newPayment.number ?? ''}
                        onChange={(e) => setNewPayment((p) => ({ ...p, number: e.target.value }))}
                        placeholder="+225 0769966800"
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                  {newPayment.type === 'bank' && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        <Landmark className="inline h-3 w-3 mr-1" />
                        IBAN / Numéro de compte
                      </label>
                      <input
                        type="text"
                        value={newPayment.iban ?? ''}
                        onChange={(e) => setNewPayment((p) => ({ ...p, iban: e.target.value }))}
                        placeholder="CI XX XXXX XXXX XXXX XXXX XXXX"
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Instructions (optionnel)</label>
                    <textarea
                      value={newPayment.instructions ?? ''}
                      onChange={(e) => setNewPayment((p) => ({ ...p, instructions: e.target.value }))}
                      rows={2}
                      placeholder="Ex: Envoyez sur ce numéro et partagez la capture de la confirmation"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setAddingPayment(false)}
                    className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" /> Annuler
                  </button>
                  <button
                    type="button"
                    onClick={addPaymentMethod}
                    disabled={saving || !newPayment.label.trim()}
                    className="flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 active:scale-[0.97]"
                  >
                    {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            {/* Methods list */}
            <div className="space-y-2">
              {paymentMethods.map((method, idx) => {
                const TypeIcon = METHOD_TYPE_ICONS[(method.type ?? 'other') as PaymentMethodType] ?? MoreHorizontal
                const isEditing = editingPaymentId === method.id
                const isDeleting = deletingPaymentId === method.id
                return (
                  <div
                    key={method.id}
                    className={`crm-card p-4 transition-all ${!method.active ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() => movePayment(method.id, 'up')}
                          disabled={idx === 0}
                          className="rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20"
                          title="Monter"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePayment(method.id, 'down')}
                          disabled={idx === paymentMethods.length - 1}
                          className="rounded p-0.5 text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20"
                          title="Descendre"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Icon */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            {isEditing ? (
                              <input
                                type="text"
                                value={method.label}
                                onChange={(e) => updatePaymentField(method.id, 'label', e.target.value)}
                                className="font-medium text-sm h-7 rounded border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring w-40"
                              />
                            ) : (
                              <span className="font-medium text-sm truncate">{method.label}</span>
                            )}
                            {method.active ? (
                              <span className="crm-pill crm-pill-accepted text-[10px] shrink-0">Actif</span>
                            ) : (
                              <span className="crm-pill crm-pill-draft text-[10px] shrink-0">Inactif</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => togglePaymentActive(method.id)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                              title={method.active ? 'Désactiver' : 'Activer'}
                            >
                              {method.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPaymentId(isEditing ? null : method.id)}
                              className={`rounded-lg p-1.5 transition-colors ${isEditing ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                              title="Modifier"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPaymentId(isDeleting ? null : method.id)}
                              className={`rounded-lg p-1.5 transition-colors ${isDeleting ? 'bg-red-50 text-red-500 dark:bg-red-950/30' : 'text-muted-foreground hover:bg-muted hover:text-red-500'}`}
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Delete confirm */}
                        {isDeleting && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 px-3 py-2">
                            <span className="text-xs text-red-600 dark:text-red-400 flex-1">Supprimer « {method.label} » ?</span>
                            <button
                              type="button"
                              onClick={() => deletePaymentMethod(method.id)}
                              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingPaymentId(null)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Annuler
                            </button>
                          </div>
                        )}

                        {/* Edit form */}
                        {isEditing && !isDeleting && (
                          <div className="mt-2 border-t border-border pt-3 space-y-2.5">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                                <select
                                  value={method.type ?? 'mobile_money'}
                                  onChange={(e) => updatePaymentField(method.id, 'type', e.target.value)}
                                  className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  {(Object.entries(METHOD_TYPE_LABELS) as [PaymentMethodType, string][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                  ))}
                                </select>
                              </div>
                              {(method.type === 'mobile_money' || method.type === 'card' || method.type === 'other' || !method.type) && (
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    <Smartphone className="inline h-3 w-3 mr-1" />
                                    Numéro / Identifiant
                                  </label>
                                  <input
                                    type="text"
                                    value={method.number ?? ''}
                                    onChange={(e) => updatePaymentField(method.id, 'number', e.target.value)}
                                    placeholder="+225 XXXXXXXXXX"
                                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                  />
                                </div>
                              )}
                              {method.type === 'bank' && (
                                <div>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">IBAN / Compte</label>
                                  <input
                                    type="text"
                                    value={method.iban ?? ''}
                                    onChange={(e) => updatePaymentField(method.id, 'iban', e.target.value)}
                                    placeholder="CI XX XXXX XXXX…"
                                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                                  />
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">Instructions</label>
                              <textarea
                                value={method.instructions ?? ''}
                                onChange={(e) => updatePaymentField(method.id, 'instructions', e.target.value)}
                                rows={2}
                                placeholder="Instructions de paiement…"
                                className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                          </div>
                        )}

                        {/* Preview (when not editing) */}
                        {!isEditing && !isDeleting && (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {method.number && <span><span className="font-medium">N° :</span> {method.number}</span>}
                            {method.iban && <span className="ml-2"><span className="font-medium">IBAN :</span> {method.iban}</span>}
                            {method.instructions && <p className="italic text-muted-foreground/70">{method.instructions}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {paymentMethods.length === 0 && !addingPayment && (
              <div className="crm-empty crm-card py-10">
                <Wallet className="crm-empty-icon" />
                <p className="crm-empty-title">Aucun moyen de paiement</p>
                <p className="text-xs text-muted-foreground">Ajoutez Wave, Orange Money, Djamo, virement bancaire…</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={savePaymentMethods}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 active:scale-[0.97]"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Enregistrer les modifications
              </button>
            </div>
          </div>
        )}

        {/* ── Company Info ── */}
        {tab === 'company' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Informations entreprise</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ces informations apparaissent sur les devis, factures et reçus PDF.</p>
            </div>

            <div className="crm-card p-5 space-y-4">
              {([
                { key: 'name', label: 'Nom de la société', placeholder: 'Scoop Afrique', required: true },
                { key: 'address', label: 'Adresse', placeholder: 'Abidjan, Cocody, Côte d\'Ivoire' },
                { key: 'email', label: 'Email de contact', placeholder: 'contact@scoop-afrique.com', type: 'email' },
                { key: 'phone', label: 'Téléphone', placeholder: '+225 07 69 96 68 00', type: 'tel' },
                { key: 'website', label: 'Site web', placeholder: 'https://www.scoop-afrique.com', type: 'url' },
                { key: 'rccm', label: 'RCCM (Registre du commerce)', placeholder: 'CI-ABJ-2025-…' },
              ] as { key: keyof CompanyInfo; label: string; placeholder: string; type?: string; required?: boolean }[]).map(({ key, label, placeholder, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {label} {required && <span className="text-primary">*</span>}
                  </label>
                  <input
                    type={type ?? 'text'}
                    value={companyInfo[key] ?? ''}
                    onChange={(e) => setCompanyInfo((c) => ({ ...c, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveCompanyInfo}
                disabled={saving || !companyInfo.name}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 active:scale-[0.97]"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* ── Reminder Preferences ── */}
        {tab === 'reminders' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Préférences de relance</h2>
              <p className="mt-1 text-sm text-muted-foreground">Configurez le comportement par défaut des relances clients.</p>
            </div>

            <div className="crm-card p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Canal de communication par défaut</label>
                <div className="flex flex-wrap gap-2">
                  {(['whatsapp', 'email', 'both'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setReminderPrefs((p) => ({ ...p, default_channel: ch }))}
                      className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                        reminderPrefs.default_channel === ch
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      {CHANNEL_LABELS[ch]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Inclure les moyens de paiement dans les relances</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Affiche Wave, Orange Money, etc. dans chaque message de relance automatiquement</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderPrefs((p) => ({ ...p, include_payment_methods_in_reminders: !p.include_payment_methods_in_reminders }))}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    reminderPrefs.include_payment_methods_in_reminders ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    reminderPrefs.include_payment_methods_in_reminders ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Envoi automatique des relances programmées</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Requiert configuration serveur cron. Les relances à statut « Programmée » sont envoyées automatiquement.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderPrefs((p) => ({ ...p, auto_send_enabled: !p.auto_send_enabled }))}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    reminderPrefs.auto_send_enabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    reminderPrefs.auto_send_enabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {reminderPrefs.auto_send_enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2">Heure d'envoi automatique</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={6}
                      max={20}
                      value={reminderPrefs.send_hour}
                      onChange={(e) => setReminderPrefs((p) => ({ ...p, send_hour: Number(e.target.value) }))}
                      className="w-20 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-muted-foreground">h00 (heure locale)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveReminderPrefs}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 active:scale-[0.97]"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* ── Reminder Rules ── */}
        {tab === 'rules' && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold">Règles de relance automatique</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Définissez quand et comment relancer automatiquement les clients en fonction des événements CRM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewRule(true)
                  setEditingRule({
                    id: `new-${Date.now()}`,
                    name: '',
                    trigger_event: 'invoice_overdue',
                    delay_days: 3,
                    channel: 'whatsapp',
                    message_template: 'Bonjour {{prenom}}, rappel concernant la facture {{reference}} ({{montant}}). Merci de procéder au règlement.',
                    is_active: true,
                    sort_order: rules.length,
                  })
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5" />
                Nouvelle règle
              </button>
            </div>

            {/* New rule editor */}
            {newRule && editingRule && (
              <RuleEditor
                rule={editingRule}
                onChange={setEditingRule}
                onSave={() => saveRule(editingRule)}
                onCancel={() => { setNewRule(false); setEditingRule(null) }}
                isNew
              />
            )}

            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className={`crm-card p-4 ${!rule.is_active ? 'opacity-60' : ''}`}>
                  {editingRule?.id === rule.id && !newRule ? (
                    <RuleEditor
                      rule={editingRule}
                      onChange={setEditingRule}
                      onSave={() => saveRule(editingRule)}
                      onCancel={() => setEditingRule(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-medium text-sm">{rule.name}</span>
                          <span className="crm-pill crm-pill-sent text-[10px]">{TRIGGER_LABELS[rule.trigger_event] ?? rule.trigger_event}</span>
                          <span className="text-xs text-muted-foreground">
                            {rule.delay_days < 0 ? `J-${Math.abs(rule.delay_days)}` : `J+${rule.delay_days}`}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{CHANNEL_LABELS[rule.channel] ?? rule.channel}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 italic">{rule.message_template}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleRuleActive(rule)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                          title={rule.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {rule.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRule(rule)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {rules.length === 0 && !newRule && (
                <div className="crm-empty crm-card py-12">
                  <Zap className="crm-empty-icon" />
                  <p className="crm-empty-title">Aucune règle configurée</p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Créez des règles pour automatiser vos relances clients selon les événements CRM.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-foreground mb-1.5">Variables disponibles dans les messages</p>
              <div className="flex flex-wrap gap-2">
                {['{{prenom}}', '{{reference}}', '{{montant}}', '{{echeance}}', '{{entreprise}}'].map((v) => (
                  <code key={v} className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-primary">{v}</code>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Rule Editor Component ── */
function RuleEditor({
  rule,
  onChange,
  onSave,
  onCancel,
  isNew = false,
}: {
  rule: ReminderRule
  onChange: (r: ReminderRule) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  return (
    <div className="space-y-3 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold">{isNew ? 'Nouvelle règle' : 'Modifier la règle'}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Nom de la règle</label>
          <input
            type="text"
            value={rule.name}
            onChange={(e) => onChange({ ...rule, name: e.target.value })}
            placeholder="Ex: Relance facture J+3"
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Déclencheur</label>
          <select
            value={rule.trigger_event}
            onChange={(e) => onChange({ ...rule, trigger_event: e.target.value })}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Object.entries({
              devis_sent: 'Après envoi devis',
              invoice_sent: 'Après envoi facture',
              invoice_due_soon: 'Avant échéance (J-)',
              invoice_overdue: 'Après retard facture',
            }).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Délai (jours {rule.trigger_event === 'invoice_due_soon' ? 'avant' : 'après'})
          </label>
          <input
            type="number"
            value={Math.abs(rule.delay_days)}
            min={0}
            max={60}
            onChange={(e) => {
              const v = Number(e.target.value)
              onChange({ ...rule, delay_days: rule.trigger_event === 'invoice_due_soon' ? -v : v })
            }}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Canal</label>
          <select
            value={rule.channel}
            onChange={(e) => onChange({ ...rule, channel: e.target.value })}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="both">WhatsApp + Email</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Message (template)</label>
        <textarea
          value={rule.message_template}
          onChange={(e) => onChange({ ...rule, message_template: e.target.value })}
          rows={3}
          placeholder="Bonjour {{prenom}}, rappel concernant…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted">
          <X className="h-3.5 w-3.5" /> Annuler
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!rule.name || !rule.message_template}
          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 active:scale-[0.97]"
        >
          <Check className="h-3.5 w-3.5" /> {isNew ? 'Créer' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
