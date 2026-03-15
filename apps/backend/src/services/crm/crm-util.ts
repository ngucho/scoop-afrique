/**
 * CRM utilities — convert Drizzle rows to API-friendly snake_case records
 */
export function toSnakeRecord<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue
    const snake = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    out[snake] = v instanceof Date ? v.toISOString() : v
  }
  return out
}
