/**
 * CRM reference generator — DV-2026-001, FAC-2026-001, PRJ-2026-001, CTR-2026-001
 */
import { desc, like, sql } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { crmDevis, crmInvoices, crmProjects, crmContracts } from '../db/schema.js'

const PREFIX_TABLE = {
  DV: crmDevis,
  FAC: crmInvoices,
  PRJ: crmProjects,
  CTR: crmContracts,
} as const

export async function nextReference(prefix: string): Promise<string> {
  const table = PREFIX_TABLE[prefix as keyof typeof PREFIX_TABLE]
  if (!table) {
    throw new Error(`Unknown reference prefix: ${prefix}`)
  }

  const year = new Date().getFullYear()
  const pattern = `${prefix}-${year}-%`

  const db = getDb()
  const [row] = await db
    .select({ reference: table.reference })
    .from(table)
    .where(like(table.reference, pattern))
    .orderBy(desc(table.reference))
    .limit(1)

  let nextNum = 1
  if (row?.reference) {
    const match = (row.reference as string).match(new RegExp(`${prefix}-${year}-(\\d+)`))
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
