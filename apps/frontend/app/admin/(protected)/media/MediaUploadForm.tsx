'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconUpload, IconLink, IconLoader2, IconPhoto } from '@tabler/icons-react'
import { Input } from 'scoop'
import { getAccessToken } from '@auth0/nextjs-auth0/client'
import { registerMediaUrl } from '@/lib/admin/actions'
import { apiUploadAuth, apiPostAuth } from '@/lib/api/adminClient'
import { compressImageFileToJpegBase64 } from '@/lib/imageCompress'
import type { ApiResponse, MediaRecord } from '@/lib/api/types'

type UploadTarget = 'supabase' | 'imgbb'

function tokenFromAuth0Client(result: unknown): string | null {
  if (typeof result === 'string' && result.length > 0) return result
  if (result && typeof result === 'object' && 'accessToken' in result) {
    const t = (result as { accessToken?: unknown }).accessToken
    if (typeof t === 'string' && t.length > 0) return t
  }
  return null
}

export function MediaUploadForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>('supabase')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setMessage('Envoi en cours…')
    try {
      const accessToken = tokenFromAuth0Client(await getAccessToken())
      if (!accessToken) {
        setMessage('Session expirée — reconnectez-vous.')
        return
      }

      if (uploadTarget === 'supabase') {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
        if (!allowed.includes(file.type)) {
          setMessage(`Type non supporté : ${file.type}`)
          return
        }
        if (file.size > 5 * 1024 * 1024) {
          setMessage('Fichier trop lourd pour le stockage Scoop (max 5 Mo). Utilisez « ImgBB (compression) ».')
          return
        }
        const formData = new FormData()
        formData.append('file', file)
        if (alt) formData.append('alt', alt)
        await apiUploadAuth<ApiResponse<MediaRecord>>('/admin/media/upload', accessToken, formData)
        setMessage('Image enregistrée sur Scoop.')
        router.refresh()
        setTimeout(() => setMessage(''), 4000)
        return
      }

      // ImgBB : compression JPEG côté client puis envoi base64 (≤ 3 Mo)
      const base64 = await compressImageFileToJpegBase64(file, 3 * 1024 * 1024)
      await apiPostAuth<ApiResponse<MediaRecord>>(
        '/admin/media/imgbb',
        accessToken,
        {
          image: base64,
          alt: alt || undefined,
          name: file.name.replace(/\.[^.]+$/, '').slice(0, 80) || undefined,
        },
      )
      setMessage('Image optimisée et hébergée via ImgBB.')
      router.refresh()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur'
      setMessage(msg.includes('not configured') || msg.includes('IMGBB') ? 'ImgBB non configuré (IMGBB_API_KEY sur le backend).' : msg)
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
          type="button"
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
          type="button"
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
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUploadTarget('supabase')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                uploadTarget === 'supabase'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/80 text-muted-foreground'
              }`}
            >
              Stockage Scoop (max 5 Mo)
            </button>
            <button
              type="button"
              onClick={() => setUploadTarget('imgbb')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                uploadTarget === 'imgbb'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted/80 text-muted-foreground'
              }`}
            >
              <IconPhoto className="h-4 w-4" />
              ImgBB — compression auto (max 3 Mo)
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {uploadTarget === 'supabase'
              ? 'Fichiers JPEG, PNG, WebP, GIF, AVIF — hébergés sur votre bucket Supabase.'
              : 'Toute image est convertie en JPEG et réduite pour rester sous 3 Mo, puis envoyée à ImgBB (clé API côté serveur).'}
          </p>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 hover:border-primary/50 hover:bg-muted/50">
            <IconUpload className="h-8 w-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Cliquez ou déposez une image
            </p>
            <input
              type="file"
              accept="image/*"
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
