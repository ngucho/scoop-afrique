'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Send, Loader2, CheckCircle } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Heading, Card, Dot, Input, Label, Textarea, Button, Select, DatePicker } from 'scoop'
import type { SelectOption } from 'scoop'
import { serviceOffers } from '@/lib/services-data'

const BUDGET_OPTIONS: SelectOption[] = [
  { value: '0-50000', label: 'Moins de 50 000 FCFA' },
  { value: '50000-150000', label: '50 000 – 150 000 FCFA' },
  { value: '150000-300000', label: '150 000 – 300 000 FCFA' },
  { value: '300000-600000', label: '300 000 – 600 000 FCFA' },
  { value: '600000-1500000', label: '600 000 – 1 500 000 FCFA' },
  { value: '1500000+', label: 'Plus de 1 500 000 FCFA' },
]

function DevisFormInner() {
  const searchParams = useSearchParams()
  const presetService = searchParams.get('service')

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [serviceSlug, setServiceSlug] = useState(presetService ?? '')
  const [budgetRange, setBudgetRange] = useState('')
  const [preferredDate, setPreferredDate] = useState<Date | undefined>()
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (presetService) setServiceSlug(presetService)
  }, [presetService])

  const parseBudget = (val: string) => {
    if (!val) return { min: undefined, max: undefined }
    const [a, b] = val.split('-').map((x) => parseInt(x.replace(/\D/g, ''), 10))
    return { min: isNaN(a) ? undefined : a, max: isNaN(b) ? undefined : b }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const { min: budget_min, max: budget_max } = parseBudget(budgetRange)

    try {
      const res = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          service_slug: serviceSlug || undefined,
          budget_min: budget_min ?? undefined,
          budget_max: budget_max ?? undefined,
          budget_currency: 'FCFA',
          preferred_date: preferredDate ? preferredDate.toISOString().slice(0, 10) : undefined,
          deadline: deadline.trim() || undefined,
          description: description.trim(),
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error ?? 'Une erreur est survenue. Réessayez.')
        return
      }

      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg('Erreur de connexion. Vérifiez votre connexion et réessayez.')
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <article className="mx-auto max-w-2xl px-6 py-20">
          <Card className="border-primary/20 bg-primary/5 p-12 text-center">
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-primary" />
            <Heading as="h1" level="h1" className="mb-4">
              Demande envoyée
            </Heading>
            <p className="mb-8 text-muted-foreground">
              Merci ! Votre demande de devis a bien été enregistrée. Notre équipe vous répondra par email sous 24 à 48 heures ouvrées.
            </p>
            <Button asChild>
              <a href="/">Retour à l&apos;accueil</a>
            </Button>
          </Card>
        </article>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          <Dot size="sm" className="text-primary" />
          Demande de devis
        </div>
        <Heading as="h1" level="h1" className="mb-4">
          Demander un <span className="text-primary">devis</span>
        </Heading>
        <p className="mb-12 text-muted-foreground">
          Remplissez le formulaire ci-dessous. Nous vous répondrons sous 24 à 48 heures avec une proposition adaptée à votre projet.
        </p>

        <Card className="border-border p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Votre prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full"
                  disabled={status === 'submitting'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Votre nom"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full"
                  disabled={status === 'submitting'}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  disabled={status === 'submitting'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                  disabled={status === 'submitting'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Entreprise / Organisation</Label>
              <Input
                id="company"
                type="text"
                placeholder="Votre entreprise ou structure"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full"
                disabled={status === 'submitting'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service souhaité</Label>
              <Select
                id="service"
                value={serviceSlug}
                onChange={(e) => setServiceSlug(e.target.value)}
                options={serviceOffers.map((s) => ({ value: s.slug, label: s.title }))}
                placeholder="Sélectionnez un service"
                disabled={status === 'submitting'}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget indicatif</Label>
              <Select
                id="budget"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                options={BUDGET_OPTIONS}
                placeholder="Sélectionnez une fourchette"
                disabled={status === 'submitting'}
                className="w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferred_date">Date souhaitée (événement)</Label>
                <DatePicker
                  value={preferredDate}
                  onChange={setPreferredDate}
                  placeholder="Sélectionner une date"
                  disabled={status === 'submitting'}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Délai / urgence</Label>
                <Input
                  id="deadline"
                  type="text"
                  placeholder="Ex. Sous 2 semaines, urgent"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full"
                  disabled={status === 'submitting'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description du projet *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre projet, vos objectifs, le contexte (événement, lancement, campagne...). Plus vous êtes précis, plus notre proposition sera adaptée."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
                minLength={10}
                className="w-full resize-y"
                disabled={status === 'submitting'}
              />
              <p className="text-xs text-muted-foreground">Minimum 10 caractères</p>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}

            <Button type="submit" disabled={status === 'submitting'} loading={status === 'submitting'}>
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer ma demande
                </>
              )}
            </Button>
          </form>
        </Card>
      </article>
      <Footer />
    </main>
  )
}

export default function DemanderDevisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DevisFormInner />
    </Suspense>
  )
}
