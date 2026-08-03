import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const migrationPath = fileURLToPath(
  new URL('../../drizzle/0061_crm_project_closure_lifecycle.sql', import.meta.url),
)
const migration = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : ''
const schema = readFileSync(
  fileURLToPath(new URL('./schema.ts', import.meta.url)),
  'utf8',
)

test('project closure migration is additive, audited, and private', () => {
  for (const name of [
    'crm_project_closure_operations',
    'crm_project_closure_items',
    'crm_invoice_adjustments',
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? public\\.${name}`))
    assert.match(migration, new RegExp(`ALTER TABLE public\\.${name} ENABLE ROW LEVEL SECURITY`))
  }
  assert.doesNotMatch(migration, /GRANT .* TO (?:anon|authenticated)/i)
  assert.match(migration, /TO service_role/i)
  assert.match(migration, /pg_policies/i)
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM crm_|ON DELETE CASCADE/i)
  assert.match(migration, /manager_attestation BOOLEAN NOT NULL DEFAULT false/i)
  assert.match(migration, /predecessor_project_id/i)
  assert.match(migration, /idempotency_key UUID NOT NULL/i)
  assert.match(migration, /request_hash TEXT NOT NULL/i)
})

test('migration backfills project archive metadata only', () => {
  assert.match(
    migration,
    /UPDATE public\.crm_projects\s+SET archived_at = COALESCE\(updated_at, created_at\)/,
  )
  assert.match(migration, /WHERE is_archived = true\s+AND archived_at IS NULL;/)
  for (const child of ['crm_devis', 'crm_invoices', 'crm_contracts', 'crm_tasks', 'crm_reminders']) {
    assert.doesNotMatch(migration, new RegExp(`UPDATE public\\.${child}\\b`))
  }
})

test('drizzle schema exposes closure metadata and adjustments', () => {
  assert.match(schema, /crmProjectClosureOperations/)
  assert.match(schema, /crmProjectClosureItems/)
  assert.match(schema, /crmInvoiceAdjustments/)
  assert.match(schema, /archiveOperationId/)
  assert.match(schema, /closureResolution/)
  assert.match(schema, /predecessorProjectId/)
  assert.match(schema, /idempotencyKey/)
  assert.match(schema, /requestHash/)
  assert.match(schema, /managerAttestation/)
  assert.match(schema, /'mixed'/)
})
