/**
 * Copy compiled PDF templates from dist/ to src/pdf-templates/ so that
 * Vercel (which runs from src/) can resolve imports like DevisTemplate.js.
 * Run after `tsc` in build.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const distTemplates = path.join(root, 'dist', 'pdf-templates')
const srcTemplates = path.join(root, 'src', 'pdf-templates')

if (!fs.existsSync(distTemplates)) {
  console.warn('copy-pdf-templates: dist/pdf-templates not found, skipping')
  process.exit(0)
}

if (!fs.existsSync(srcTemplates)) {
  fs.mkdirSync(srcTemplates, { recursive: true })
}

for (const name of fs.readdirSync(distTemplates)) {
  if (name.endsWith('.js')) {
    const src = path.join(distTemplates, name)
    const dest = path.join(srcTemplates, name)
    fs.copyFileSync(src, dest)
    console.log('copy-pdf-templates:', name)
  }
}
