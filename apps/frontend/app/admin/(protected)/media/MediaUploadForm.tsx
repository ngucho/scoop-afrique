'use client'

import { useState, useTransition } from 'react'
import { IconUpload, IconLink, IconLoader2 } from '@tabler/icons-react'
import { Input } from 'scoop'
import { registerMediaUrl } from '@/lib/admin/actions'
import { getApiUrl } from '@/lib/api/client'

export function MediaUploadForm() {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setMessage('Upload en cours...')
    // For file upload, we need to use fetch directly (multipart)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (alt) formData.append('alt', alt)

      const { getAccessToken } = await import('@auth0/nextjs-auth0/client')
      // Client-side: use a server action or direct fetch
      setMessage('Veuillez utiliser le backend API pour uploader des fichiers.')
    } catch {
      setMessage("Erreur lors de l'upload.")
    }
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    startTransition(async () => {
      try {
        await registerMediaUrl({ url, alt: alt || undefined })
        setUrl('')
        setAlt('')
        setMessage('Image enregistrée !')
        setTimeout(() => setMessage(''), 3000)
      } catch {
        setMessage("Erreur lors de l'enregistrement.")
      }
    })
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode('upload')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === 'upload'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <IconUpload className="h-4 w-4" />
          Upload
        </button>
        <button
          onClick={() => setMode('url')}
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === 'url'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <IconLink className="h-4 w-4" />
          URL externe
        </button>
      </div>

      {mode === 'upload' ? (
        <div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 hover:border-primary/50 hover:bg-muted/50">
            <IconUpload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Cliquez ou glissez une image (JPEG, PNG, WebP, GIF — max 5 Mo)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <form onSubmit={handleUrlSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              URL de l&apos;image
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Texte alternatif
            </label>
            <Input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Description"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : null}
            Ajouter
          </button>
        </form>
      )}

      {message && (
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
