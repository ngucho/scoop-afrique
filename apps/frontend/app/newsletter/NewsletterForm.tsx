'use client'

import { useState } from 'react'
import { Button, Input, Label, Alert } from 'scoop'
import { subscribeNewsletter } from './actions'

export function NewsletterForm() {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData(e.currentTarget)
      const res = await subscribeNewsletter(formData)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newsletter-email">Email</Label>
        <Input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          required
          disabled={loading}
        />
      </div>
      {result && (
        <Alert variant={result.success ? 'success' : 'error'}>
          {result.message}
        </Alert>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? 'Envoi…' : "S'inscrire"}
      </Button>
    </form>
  )
}
