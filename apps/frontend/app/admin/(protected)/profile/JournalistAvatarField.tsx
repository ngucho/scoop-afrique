'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Avatar, Button, Dialog, Input } from 'scoop'
import { IconPhoto, IconUpload } from '@tabler/icons-react'
import { uploadJournalistAvatarToImgbb } from '@/lib/admin/uploadJournalistAvatar'

const CROP_OUTPUT_MAX = 512

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('Impossible de charger l’image.')))
    if (src.startsWith('http')) img.crossOrigin = 'anonymous'
    img.src = src
  })
}

async function cropAndResizeToJpegBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponible.')

  const { width: cw, height: ch } = pixelCrop
  canvas.width = cw
  canvas.height = ch
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, cw, ch, 0, 0, cw, ch)

  let outCanvas = canvas
  const maxSide = Math.max(cw, ch)
  if (maxSide > CROP_OUTPUT_MAX) {
    const scale = CROP_OUTPUT_MAX / maxSide
    const w = Math.round(cw * scale)
    const h = Math.round(ch * scale)
    const c2 = document.createElement('canvas')
    c2.width = w
    c2.height = h
    const c2ctx = c2.getContext('2d')
    if (!c2ctx) throw new Error('Canvas non disponible.')
    c2ctx.imageSmoothingEnabled = true
    c2ctx.imageSmoothingQuality = 'high'
    c2ctx.drawImage(canvas, 0, 0, w, h)
    outCanvas = c2
  }

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export image impossible.'))),
      'image/jpeg',
      0.88,
    )
  })
}

export function JournalistAvatarField({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const openFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    if (imageSrc?.startsWith('blob:')) URL.revokeObjectURL(imageSrc)
    setImageSrc(null)
  }

  const confirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setUploading(true)
    setError(null)
    try {
      const blob = await cropAndResizeToJpegBlob(imageSrc, croppedAreaPixels)
      const fd = new FormData()
      fd.set('image', blob, 'avatar.jpg')
      const url = await uploadJournalistAvatarToImgbb(fd)
      onChange(url)
      closeDialog()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload impossible.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="mb-1 block text-sm font-medium">Photo de profil (lecteurs)</label>
      <p className="text-xs text-muted-foreground">
        URL directe ou fichier : recadrage carré, image redimensionnée puis hébergée (imgbb).
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-full border border-border/60 p-0.5">
          <Avatar src={value || undefined} alt="" size="lg" fallback="?" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            type="url"
            disabled={disabled}
          />
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              id="journalist-avatar-file"
              disabled={disabled || uploading}
              onChange={(e) => openFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="outline" size="sm" disabled={disabled || uploading} asChild>
              <label htmlFor="journalist-avatar-file" className="inline-flex cursor-pointer items-center gap-2">
                <IconUpload className="h-4 w-4" />
                Choisir une image
              </label>
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => !o && closeDialog()}
        title="Recadrer la photo"
        description="Cadre carré, zoom si besoin."
        className="max-w-lg"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={uploading}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void confirmCrop()} disabled={uploading || !croppedAreaPixels}>
              {uploading ? 'Envoi…' : 'Valider et envoyer'}
            </Button>
          </div>
        }
      >
        {imageSrc ? (
          <div className="space-y-3">
            <div className="relative h-56 w-full overflow-hidden rounded-lg bg-muted md:h-64">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3">
              <IconPhoto className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Zoom du recadrage"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  )
}
