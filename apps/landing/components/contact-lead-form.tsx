'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Input, Label, Textarea } from 'scoop'
import { buttonDefaultClassName } from '@/lib/landing'

const CONTACT_EMAIL = 'Contact@scoop-afrique.com'
const SUBJECT_OPTIONS = [
  { value: 'Devis / Partenariat', label: 'Devis ou partenariat' },
  { value: 'Couverture vidéo / Événement', label: 'Couverture vidéo / événement' },
  { value: 'Interview / Podcast', label: 'Interview / podcast' },
  { value: 'Publicité / Campagne', label: 'Publicité / campagne' },
  { value: 'Presse', label: 'Presse' },
  { value: 'Autre', label: 'Autre' },
]

export function ContactLeadForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0].value)
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = [
      `Nom / Société : ${name || '(non renseigné)'}`,
      `Email : ${email || '(non renseigné)'}`,
      `Objet : ${subject}`,
      '',
      'Message :',
      message || '(vide)',
    ].join('\n')
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[Site] ${subject}`)}&body=${encodeURIComponent(body)}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lead-name">Nom ou société</Label>
          <Input
            id="lead-name"
            type="text"
            placeholder="Votre nom ou raison sociale"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-email">Email</Label>
          <Input
            id="lead-email"
            type="email"
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-subject">Objet de votre demande</Label>
        <select
          id="lead-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border-2 border-border bg-background px-4 py-3 font-sans text-sm outline-none transition-colors focus:border-primary"
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-message">Message</Label>
        <Textarea
          id="lead-message"
          placeholder="Décrivez votre projet ou votre demande..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full resize-y"
        />
      </div>
      <button type="submit" className={`${buttonDefaultClassName} inline-flex items-center gap-2`}>
        <Send className="h-4 w-4" />
        Envoyer ma demande
      </button>
    </form>
  )
}
