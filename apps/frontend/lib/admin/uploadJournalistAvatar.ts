'use server'

/**
 * Upload avatar (JPEG/PNG blob from client) to imgbb — URL stockée en public_avatar_url.
 * Clé serveur uniquement : IMGBB_API_KEY
 */
export async function uploadJournalistAvatarToImgbb(formData: FormData): Promise<string> {
  const key = process.env.IMGBB_API_KEY?.trim()
  if (!key) {
    throw new Error(
      "Upload photo : variable d'environnement IMGBB_API_KEY manquante sur le serveur frontend.",
    )
  }

  const file = formData.get('image')
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('Image invalide.')
  }
  if (file.size > 2.5 * 1024 * 1024) {
    throw new Error('Image trop volumineuse (max. 2,5 Mo après recadrage).')
  }

  const buf = Buffer.from(await file.arrayBuffer())
  const base64 = buf.toString('base64')

  const body = new URLSearchParams()
  body.set('key', key)
  body.set('image', base64)

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  })

  const json = (await res.json()) as {
    data?: { url?: string; display_url?: string }
    success?: boolean
    error?: { message?: string }
  }

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? "Échec de l'upload (imgbb).")
  }

  const url = json.data?.url ?? json.data?.display_url
  if (!url) {
    throw new Error('Réponse imgbb inattendue.')
  }

  return url
}
