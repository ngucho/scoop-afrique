/**
 * Redimensionne les images de public/publications aux bonnes dimensions :
 * - TikTok : 405×720 (9/16)
 * - Instagram : 600×600 (1:1)
 * - Facebook : 1280×720 (16:9)
 *
 * Usage (depuis apps/landing) : node scripts/resize-publications.mjs
 * Ou depuis la racine : node apps/landing/scripts/resize-publications.mjs
 * (nécessite : pnpm add -D sharp dans apps/landing)
 */

import { readdir, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(__dirname, '..', 'public', 'publications')
const OUT_DIR = join(PUBLIC_DIR, 'resized')

const DIMENSIONS = {
  tiktok: { width: 405, height: 720 },
  insta: { width: 600, height: 600 },
  fb: { width: 1280, height: 720 },
}

async function resize() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.error('Installez sharp dans apps/landing : pnpm add -D sharp --filter @scoop-afrique/landing')
    process.exit(1)
  }

  await mkdir(OUT_DIR, { recursive: true }).catch(() => {})

  const files = await readdir(PUBLIC_DIR)
  const pngs = files.filter((f) => f.endsWith('.png') && !f.startsWith('resized'))

  for (const file of pngs) {
    const match = file.match(/publication-(tiktok|insta|fb)(\d+)\.png/)
    if (!match) continue
    const [, type, num] = match
    const dims = DIMENSIONS[type]
    if (!dims) continue
    const src = join(PUBLIC_DIR, file)
    const out = join(OUT_DIR, file)
    await sharp(src)
      .resize(dims.width, dims.height, { fit: 'cover', position: 'center' })
      .toFile(out)
    console.log(`Resized ${file} -> ${dims.width}x${dims.height}`)
  }

  console.log('Done. Utilisez /publications/resized/... si vous voulez les versions redimensionnées.')
}

resize().catch((e) => {
  console.error(e)
  process.exit(1)
})
