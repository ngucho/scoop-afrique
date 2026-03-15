/**
 * Seed default categories for Scoop Afrique.
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 * Run after migrations: pnpm db:seed
 */
import 'dotenv/config'
import { getDb } from '../src/db/index.js'
import { categories } from '../src/db/schema.js'

const defaultCategories = [
  { slug: 'actualites', name: 'Actualités', description: 'Breaking news et actualité panafricaine', sortOrder: 1 },
  { slug: 'politique', name: 'Politique', description: 'Politique, gouvernance et relations internationales', sortOrder: 2 },
  { slug: 'economie', name: 'Économie', description: 'Économie, business et marchés africains', sortOrder: 3 },
  { slug: 'societe', name: 'Société', description: 'Faits de société et vie quotidienne', sortOrder: 4 },
  { slug: 'culture', name: 'Culture', description: 'Culture, arts et divertissement', sortOrder: 5 },
  { slug: 'sport', name: 'Sport', description: 'Sport africain et international', sortOrder: 6 },
  { slug: 'opinions', name: 'Opinions', description: 'Tribunes, éditoriaux et points de vue', sortOrder: 7 },
  { slug: 'dossiers', name: 'Dossiers', description: 'Dossiers et enquêtes', sortOrder: 8 },
  { slug: 'videos', name: 'Vidéos', description: 'Reportages et contenus vidéo', sortOrder: 9 },
  { slug: 'sante', name: 'Santé', description: 'Santé publique et bien-être', sortOrder: 10 },
  { slug: 'environnement', name: 'Environnement', description: 'Climat, biodiversité et transition', sortOrder: 11 },
  { slug: 'technologie', name: 'Technologie', description: 'Tech, innovation et numérique', sortOrder: 12 },
  { slug: 'genre', name: 'Genre', description: 'Agenda femmes et égalité', sortOrder: 13 },
]

async function seed() {
  const db = getDb()
  for (const cat of defaultCategories) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.slug })
  }
  console.log(`Seeded ${defaultCategories.length} categories.`)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
