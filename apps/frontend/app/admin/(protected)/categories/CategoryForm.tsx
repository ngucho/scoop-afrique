'use client'

import { useState, useTransition } from 'react'
import { Input } from 'scoop'
import { IconPlus, IconLoader2 } from '@tabler/icons-react'
import { createCategory } from '@/lib/admin/actions'

export function CategoryForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      try {
        await createCategory({ name, description: description || undefined })
        setName('')
        setDescription('')
      } catch {
        alert('Erreur lors de la création.')
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Nom
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouvelle catégorie"
          required
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Description (optionnel)
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconPlus className="h-4 w-4" />}
        Ajouter
      </button>
    </form>
  )
}
