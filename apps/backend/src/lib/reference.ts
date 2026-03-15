/**
 * CRM reference generator — DV-2026-001, FAC-2026-001, PRJ-2026-001, CTR-2026-001
 */
import { getSupabase } from './supabase.js'

const PREFIX_TABLE: Record<string, string> = {
  DV: 'crm_devis',
  FAC: 'crm_invoices',
  PRJ: 'crm_projects',
  CTR: 'crm_contracts',
}

export async function nextReference(prefix: string): Promise<string> {
  const table = PREFIX_TABLE[prefix]
  if (!table) {
    throw new Error(`Unknown reference prefix: ${prefix}`)
  }

  const year = new Date().getFullYear()
  const pattern = `${prefix}-${year}-%`

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(table)
    .select('reference')
    .like('reference', pattern)
    .order('reference', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to get next reference: ${error.message}`)
  }

  let nextNum = 1
  if (data?.reference) {
    const match = (data.reference as string).match(new RegExp(`${prefix}-${year}-(\\d+)`))
    if (match) {
      nextNum = parseInt(match[1], 10) + 1
    }
  }

  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
