'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, Input, Button } from 'scoop'
import { IconLock, IconLoader2 } from '@tabler/icons-react'
import { changePassword } from '@/lib/admin/actions'

export function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'Les deux mots de passe ne correspondent pas.' })
      return
    }
    startTransition(async () => {
      try {
        await changePassword(password)
        setMessage({ type: 'success', text: 'Mot de passe mis à jour.' })
        setPassword('')
        setConfirm('')
      } catch (err) {
        setMessage({
          type: 'error',
          text: err instanceof Error ? err.message : 'Impossible de modifier le mot de passe (comptes sociaux : utilisez votre fournisseur).',
        })
      }
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-2 font-semibold">Changer le mot de passe</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Uniquement pour les comptes Auth0 (base de données). Les comptes Google, etc. doivent modifier le mot de passe chez leur fournisseur.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nouveau mot de passe</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Confirmer le mot de passe</label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={isPending} className="inline-flex items-center gap-2">
            {isPending ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconLock className="h-4 w-4" />
            )}
            <span>Mettre à jour le mot de passe</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
