'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Select, Textarea } from 'scoop'
import { CONTRACT_MODELS } from '@/lib/contract-models'

const schema = z.object({
  title: z.string().min(1, 'Titre requis'),
  type: z.string().optional().default('service'),
  contact_id: z.string().uuid().optional().or(z.literal('')),
  project_id: z.string().uuid().optional().or(z.literal('')),
  devis_id: z.string().uuid().optional().or(z.literal('')),
  expires_at: z.string().optional(),
  content: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ContractFormProps {
  contractId?: string
  defaultValues?: Partial<FormData>
  contacts?: Array<{ id: string; first_name?: string; last_name?: string }>
  projects?: Array<{ id: string; reference: string; title: string }>
}

export function ContractForm({
  contractId,
  defaultValues,
  contacts = [],
  projects = [],
}: ContractFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? { type: 'service' },
  })

  const type = watch('type')

  function loadModel() {
    const model = type && CONTRACT_MODELS[type]
    if (model) {
      setValue('title', model.title)
      setValue('content', JSON.stringify({ clauses: model.clauses }, null, 2))
    }
  }

  async function onSubmit(data: FormData) {
    let content: Record<string, unknown> = {}
    if (data.content) {
      try {
        content = JSON.parse(data.content) as Record<string, unknown>
      } catch {
        content = { raw: data.content }
      }
    }
    const body = {
      title: data.title,
      type: data.type,
      contact_id: data.contact_id || undefined,
      project_id: data.project_id || undefined,
      devis_id: data.devis_id || undefined,
      expires_at: data.expires_at || undefined,
      content,
    }
    const url = contractId ? `/api/crm/contracts/${contractId}` : '/api/crm/contracts'
    const res = await fetch(url, {
      method: contractId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
    const json = await res.json()
    if (!res.ok) {
      alert(json.error ?? 'Erreur')
      return
    }
    router.push(`/contracts/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          {...register('title')}
          className={errors.title ? 'border-destructive' : ''}
          placeholder="Ex: Contrat de prestation de services — Projet X"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="type">Type de contrat</Label>
        <div className="flex gap-2">
          <Select
            id="type"
            {...register('type')}
            options={[
              { value: 'service', label: 'Prestation de services' },
              { value: 'partenariat', label: 'Partenariat' },
              { value: 'nda', label: 'NDA (Confidentialité)' },
              { value: 'autre', label: 'Autre' },
            ]}
            className="flex-1"
          />
          {type && type !== 'autre' && CONTRACT_MODELS[type] && (
            <Button type="button" variant="outline" onClick={loadModel}>
              Charger le modèle
            </Button>
          )}
        </div>
      </div>
      {contacts.length > 0 && (
        <div>
          <Label htmlFor="contact_id">Contact</Label>
          <select
            id="contact_id"
            {...register('contact_id')}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.id}
              </option>
            ))}
          </select>
        </div>
      )}
      {projects.length > 0 && (
        <div>
          <Label htmlFor="project_id">Projet</Label>
          <select
            id="project_id"
            {...register('project_id')}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Sélectionner —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reference} — {p.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <Label htmlFor="expires_at">Date d&apos;expiration</Label>
        <Input id="expires_at" type="date" {...register('expires_at')} />
      </div>
      <div>
        <Label htmlFor="content">Contenu du contrat (JSON — clauses)</Label>
        <Textarea
          id="content"
          {...register('content')}
          rows={12}
          placeholder='{"clauses": [{"title": "Article 1", "text": "..."}]}'
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Utilisez &quot;Charger le modèle&quot; pour pré-remplir avec un contrat type.
        </p>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement…' : contractId ? 'Mettre à jour' : 'Créer le contrat'}
      </Button>
    </form>
  )
}
