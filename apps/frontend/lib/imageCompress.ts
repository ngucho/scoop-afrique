/**
 * Client-side JPEG compression for ImgBB uploads (target max binary size).
 */
const MAX_BYTES_DEFAULT = 3 * 1024 * 1024

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * Returns raw base64 (no data: prefix) suitable for POST /admin/media/imgbb.
 */
export async function compressImageFileToJpegBase64(
  file: File,
  maxBytes: number = MAX_BYTES_DEFAULT
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  let w = bitmap.width
  let h = bitmap.height
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponible')

  const encode = (quality: number) => {
    canvas.width = Math.max(1, Math.round(w))
    canvas.height = Math.max(1, Math.round(h))
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
  }

  let quality = 0.92
  let blob = await encode(quality)

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.07
    blob = await encode(quality)
  }

  while (blob && blob.size > maxBytes && Math.max(w, h) > 480) {
    const factor = 0.88
    w *= factor
    h *= factor
    quality = 0.82
    blob = await encode(quality)
  }

  bitmap.close()

  if (!blob || blob.size > maxBytes) {
    throw new Error(
      `L'image dépasse encore ${(maxBytes / (1024 * 1024)).toFixed(1)} Mo après compression. Essayez une image plus petite.`
    )
  }

  const buf = await blob.arrayBuffer()
  return arrayBufferToBase64(buf)
}
