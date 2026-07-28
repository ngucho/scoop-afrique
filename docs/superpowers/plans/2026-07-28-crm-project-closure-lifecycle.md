# CRM Project Closure Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer l’archivage isolé d’un projet par une clôture transactionnelle qui résout les factures ouvertes, fige toutes les mutations associées et conserve intégralement l’historique commercial et financier.

**Architecture:** Un domaine pur calcule l’aperçu, les résolutions et l’empreinte du dossier. Un service de clôture orchestre une transaction PostgreSQL verrouillée et journalisée. Une garde commune bloque ensuite toute mutation d’une entité rattachée à un projet archivé. Le CRM Next.js utilise un assistant en quatre étapes et affiche le dossier archivé en lecture seule.

**Tech Stack:** TypeScript 5.7, Node.js test runner, Hono, Drizzle ORM 0.45/PostgreSQL via Supabase pooler, Zod 3, Next.js 16 App Router, React 19.

## Global Constraints

- Travailler directement sur la branche `dev`, conformément à la décision utilisateur.
- Ne jamais supprimer automatiquement une facture émise, un paiement, un reçu, une dépense, un justificatif ou un mouvement de trésorerie.
- Après archivage, aucune mutation opérationnelle ou financière liée au projet n’est autorisée.
- Une facture ouverte doit être résolue par paiement existant, avoir ou créance abandonnée avant la clôture.
- La facture originale, ses lignes et son total ne sont jamais réécrits.
- Toute clôture utilise une transaction PostgreSQL unique, un verrou projet et une clé d’idempotence.
- Les anciennes archives ne sont jamais régularisées automatiquement.
- La suppression SQL définitive et l’intégration API FNE sont hors périmètre.
- Toutes les opérations de clôture, régularisation et restauration exigent exactement `manage:crm`.
- Les nouvelles tables `public` activent RLS et n’accordent aucun droit à `anon` ou `authenticated`; seul le backend/service role y accède.
- Ne pas appliquer de migration à la base Supabase distante dans ce plan; produire, valider et committer la migration locale.
- Préserver les fichiers non suivis de l’utilisateur.

---

## File Map

### Backend domain and persistence

- `apps/backend/drizzle/0061_crm_project_closure_lifecycle.sql` — migration additive et réversible par sauvegarde.
- `apps/backend/drizzle/meta/_journal.json` — entrée locale de migration suivant la convention Drizzle existante.
- `apps/backend/src/db/schema.ts` — enums, colonnes et nouvelles tables Drizzle.
- `apps/backend/src/schemas/crm/project-closure.schema.ts` — contrat HTTP de clôture.
- `apps/backend/src/services/crm/project-closure.types.ts` — types stables partagés.
- `apps/backend/src/services/crm/project-closure.policy.ts` — calculs purs, résolution et empreinte.
- `apps/backend/src/services/crm/project-closure.repository.ts` — lectures et écritures Drizzle dans une transaction.
- `apps/backend/src/services/crm/project-closure.service.ts` — orchestration métier.
- `apps/backend/src/services/crm/project-write-guard.ts` — résolution du projet parent et refus des mutations.
- `apps/backend/src/routes/crm/project-closure.ts` — aperçu, clôture, restauration et régularisation.

### Backend integration

- `apps/backend/src/routes/crm/index.ts` — montage du routeur de clôture.
- `apps/backend/src/middleware/crm-authorization.ts` — classification des nouvelles routes en `manage:crm`.
- `apps/backend/src/routes/crm/{projects,tasks,deliverables,devis,invoices,contracts,reminders,treasury}.ts` — garde du projet parent.
- `apps/backend/src/services/crm/{project,task,deliverable,devis,invoice,payment,expense,contract,reminder,treasury}.service.ts` — garde au niveau service et lectures historiques.
- `apps/backend/src/services/crm/{dashboard,reports}.service.ts` — périmètres opérationnels et financiers.

### CRM frontend

- `apps/crm/lib/project-closure.ts` — types et helpers d’affichage.
- `apps/crm/components/projects/ProjectClosureWizard.tsx` — assistant en quatre étapes.
- `apps/crm/components/projects/ProjectArchivedBanner.tsx` — état historique figé.
- `apps/crm/components/projects/ProjectArchiveReconciliation.tsx` — régularisation manuelle.
- `apps/crm/app/(protected)/projects/[id]/page.tsx` — action, bandeau et documents historiques.
- `apps/crm/app/(protected)/projects/page.tsx` — file des archives à régulariser.
- `apps/crm/lib/rbac.ts` — parité BFF des nouvelles routes de gestion.

---

### Task 1: Schéma de cycle de vie et migration additive

**Files:**

- Create: `apps/backend/drizzle/0061_crm_project_closure_lifecycle.sql`
- Modify: `apps/backend/drizzle/meta/_journal.json`
- Modify: `apps/backend/src/db/schema.ts`
- Create: `apps/backend/src/db/project-closure-schema.test.ts`

**Interfaces:**

- Produces enums `crm_project_closure_type`, `crm_project_closure_status`, `crm_invoice_adjustment_type`, `crm_invoice_closure_resolution`.
- Produces tables `crm_project_closure_operations`, `crm_project_closure_items`, `crm_invoice_adjustments`.
- Adds archive metadata to `crm_projects`, `crm_devis`, `crm_invoices`, `crm_contracts`.
- Adds nullable `predecessor_project_id` to `crm_projects`.
- Adds unique `idempotency_key` and required `request_hash` to closure operations.
- Adds `cancelled` to `crm_task_status`.

- [ ] **Step 1: Write the failing structural schema test**

Create a test that reads the migration and schema source and asserts all mandatory definitions:

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const migration = readFileSync(
  fileURLToPath(new URL('../../drizzle/0061_crm_project_closure_lifecycle.sql', import.meta.url)),
  'utf8',
)
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
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM crm_|ON DELETE CASCADE/i)
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
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/db/project-closure-schema.test.ts
```

Expected: FAIL because the migration and schema definitions do not exist.

- [ ] **Step 3: Add the Drizzle schema definitions**

Use exact enum values:

```ts
export const crmProjectClosureTypeEnum = pgEnum('crm_project_closure_type', [
  'completed',
  'client_abandoned',
  'mutual_termination',
  'company_cancelled',
])
export const crmProjectClosureStatusEnum = pgEnum('crm_project_closure_status', [
  'completed',
  'reversed',
])
export const crmInvoiceAdjustmentTypeEnum = pgEnum('crm_invoice_adjustment_type', [
  'credit_note',
  'bad_debt',
])
export const crmInvoiceClosureResolutionEnum = pgEnum('crm_invoice_closure_resolution', [
  'paid',
  'credit_note',
  'bad_debt',
])
```

Add nullable archive metadata to the four document tables. Add
`predecessor_project_id` as a self-reference on projects with
`ON DELETE RESTRICT`. Add the three tables and foreign keys with
`ON DELETE RESTRICT` for closure and financial records. Store
`idempotency_key UUID NOT NULL UNIQUE` and `request_hash TEXT NOT NULL` on each
closure operation. Add `cancelled` to the existing task enum without changing
existing values.

- [ ] **Step 4: Create the additive SQL migration**

The migration must:

1. create enums idempotently;
2. `ALTER TYPE crm_task_status ADD VALUE IF NOT EXISTS 'cancelled'`;
3. add nullable columns with `ADD COLUMN IF NOT EXISTS`;
4. create tables and indexes;
5. enable RLS on the three new tables;
6. grant CRUD only to `service_role`;
7. create `FOR ALL TO service_role USING (true) WITH CHECK (true)` policies;
8. backfill only project metadata:

```sql
UPDATE public.crm_projects
SET archived_at = COALESCE(updated_at, created_at),
    archive_reason = COALESCE(
      archive_reason,
      'Archive antérieure à la gestion des clôtures'
    )
WHERE is_archived = true
  AND archived_at IS NULL;
```

Do not update any child entity during migration.

- [ ] **Step 5: Update the Drizzle journal without regenerating old migrations**

Append one entry with the next `idx`, a unique `when`, and tag
`0061_crm_project_closure_lifecycle`. Do not run `drizzle-kit generate`
because the repository journal stops before several manually maintained SQL
files. Do not add or alter entries for `0048`–`0060` in this CRM task; record
that pre-existing migration-history drift in the runbook as a deployment
precondition requiring reconciliation before any remote migration.

- [ ] **Step 6: Verify GREEN and build**

Run:

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/db/project-closure-schema.test.ts
corepack pnpm --filter @scoop-afrique/backend run build
git diff --check
```

Expected: tests and build PASS; no migration is applied remotely.

- [ ] **Step 7: Commit**

```powershell
git add -- apps/backend/drizzle/0061_crm_project_closure_lifecycle.sql apps/backend/drizzle/meta/_journal.json apps/backend/src/db/schema.ts apps/backend/src/db/project-closure-schema.test.ts
git commit -m "feat(crm): add project closure lifecycle schema"
```

---

### Task 2: Domaine pur de clôture et validation des résolutions

**Files:**

- Create: `apps/backend/src/services/crm/project-closure.types.ts`
- Create: `apps/backend/src/services/crm/project-closure.policy.ts`
- Create: `apps/backend/src/services/crm/project-closure.policy.test.ts`
- Create: `apps/backend/src/schemas/crm/project-closure.schema.ts`

**Interfaces:**

- Produces `ClosureSnapshot`, `ClosurePreview`, `InvoiceResolutionInput`, `ClosurePlan`.
- Produces:

```ts
export function buildClosurePreview(snapshot: ClosureSnapshot): ClosurePreview
export function buildClosurePlan(
  snapshot: ClosureSnapshot,
  input: CloseProjectInput,
): ClosurePlan
export function closureFingerprint(snapshot: ClosureSnapshot): string
```

- [ ] **Step 1: Write failing policy tests**

Cover at least:

```ts
test('paid invoices require no adjustment')
test('draft invoices are cancelled and archived')
test('an open invoice requires an exact remaining-balance resolution')
test('a credit note for an issued invoice requires an external reference')
test('bad debt preserves the original invoice total')
test('open tasks and future reminders are cancelled')
test('payments receipts expenses and treasury movements are preserved')
test('fingerprints are stable for identical snapshots')
test('fingerprints change when a payment or document changes')
test('restoration is forbidden after a credit note or bad debt')
```

Representative assertion:

```ts
assert.throws(
  () => buildClosurePlan(snapshot, inputWithoutInvoiceResolution),
  (error: unknown) =>
    error instanceof ClosurePolicyError &&
    error.code === 'INVOICE_RESOLUTION_REQUIRED',
)
```

- [ ] **Step 2: Run the tests and verify RED**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure.policy.test.ts
```

Expected: FAIL because the domain functions do not exist.

- [ ] **Step 3: Define stable domain types**

`ClosureSnapshot` must contain sorted arrays of projects, documents, payments,
tasks, reminders, deliverables, expenses and treasury movements. Monetary
amounts remain integer FCFA values.

`ClosurePlan` contains explicit actions:

```ts
export interface ClosurePlan {
  fingerprint: string
  invoiceAdjustments: InvoiceAdjustmentPlan[]
  archiveDevisIds: string[]
  archiveInvoiceIds: string[]
  archiveContractIds: string[]
  cancelTaskIds: string[]
  cancelReminderIds: string[]
  preserved: Array<{ entityType: string; entityId: string }>
  restorable: boolean
}
```

- [ ] **Step 4: Implement deterministic fingerprinting**

Canonicalize object keys and sort every entity array by ID before hashing with
SHA-256. Exclude volatile display-only fields. Include:

- project `closure_version`;
- IDs, statuses, archive flags and timestamps of documents;
- invoice totals and amounts paid;
- payment IDs, amounts and dates;
- open task and reminder statuses.

- [ ] **Step 5: Implement policy and Zod contract**

`closeProjectSchema` must require:

```ts
{
  closure_type: z.enum([
    'completed',
    'client_abandoned',
    'mutual_termination',
    'company_cancelled',
  ]),
  reason: z.string().trim().min(10).max(2000),
  closure_version: z.number().int().nonnegative(),
  preview_fingerprint: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  invoice_resolutions: z.array(invoiceResolutionSchema),
}
```

For `credit_note`, `external_reference` is mandatory when invoice status is not
`draft`. For `bad_debt`, `reason` and either `evidence_url` or an explicit
`manager_attestation: true` are mandatory.

- [ ] **Step 6: Verify GREEN**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure.policy.test.ts
corepack pnpm --filter @scoop-afrique/backend run build
```

- [ ] **Step 7: Commit**

```powershell
git add -- apps/backend/src/services/crm/project-closure.types.ts apps/backend/src/services/crm/project-closure.policy.ts apps/backend/src/services/crm/project-closure.policy.test.ts apps/backend/src/schemas/crm/project-closure.schema.ts
git commit -m "feat(crm): define project closure policy"
```

---

### Task 3: Aperçu de clôture et classification des routes

**Files:**

- Create: `apps/backend/src/services/crm/project-closure.repository.ts`
- Create: `apps/backend/src/services/crm/project-closure.service.ts`
- Create: `apps/backend/src/routes/crm/project-closure.ts`
- Modify: `apps/backend/src/routes/crm/index.ts`
- Modify: `apps/backend/src/middleware/crm-authorization.ts`
- Modify: `apps/backend/src/middleware/crm-authorization.test.ts`
- Create: `apps/backend/src/routes/crm/project-closure.test.ts`

**Interfaces:**

- Produces:

```ts
export async function getClosurePreview(projectId: string): Promise<ClosurePreview | null>
```

- Adds `GET /projects/:id/closure-preview`.

- [ ] **Step 1: Extend failing permission tests**

Assert:

```ts
['GET', '/api/v1/crm/projects/p1/closure-preview', 'manage:crm']
['POST', '/api/v1/crm/projects/p1/close-and-archive', 'manage:crm']
['POST', '/api/v1/crm/projects/p1/create-follow-up', 'manage:crm']
['GET', '/api/v1/crm/projects/archive-reconciliation', 'manage:crm']
['POST', '/api/v1/crm/projects/p1/archive-reconciliation', 'manage:crm']
```

The GET exceptions must be classified as manage despite the global GET rule.

- [ ] **Step 2: Write failing preview route tests**

Use a route factory with an injected preview function. Test:

- `404` for missing project;
- `200` with counts, invoice balances, version and fingerprint;
- archived legacy project includes `requires_reconciliation: true`;
- no database mutation occurs during preview.

- [ ] **Step 3: Run RED tests**

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/crm-authorization.test.ts src/routes/crm/project-closure.test.ts
```

- [ ] **Step 4: Implement snapshot loading**

Load the complete folder in bounded queries. Never use N+1 payment queries:

- one project query;
- one query per document family;
- one payment query joined or filtered by invoice IDs;
- one query each for tasks, reminders, deliverables, expenses and treasury.

Return dates as ISO strings and monetary amounts as integers.

- [ ] **Step 5: Implement route and permission classification**

Register closure management paths before the generic GET read classification:

```ts
const projectClosureManagePattern =
  /^\/projects\/(?:archive-reconciliation|[^/]+\/(?:closure-preview|close-and-archive|create-follow-up|archive-reconciliation))$/
```

Mount the focused router under `/projects`.

- [ ] **Step 6: Verify GREEN and full backend suite**

```powershell
corepack pnpm --filter @scoop-afrique/backend exec node --import tsx --test src/middleware/crm-authorization.test.ts src/routes/crm/project-closure.test.ts
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
```

- [ ] **Step 7: Commit**

```powershell
git add -- apps/backend/src/services/crm/project-closure.repository.ts apps/backend/src/services/crm/project-closure.service.ts apps/backend/src/routes/crm/project-closure.ts apps/backend/src/routes/crm/index.ts apps/backend/src/middleware/crm-authorization.ts apps/backend/src/middleware/crm-authorization.test.ts apps/backend/src/routes/crm/project-closure.test.ts
git commit -m "feat(crm): expose project closure preview"
```

---

### Task 4: Transaction atomique, idempotence et restauration

**Files:**

- Modify: `apps/backend/src/services/crm/project-closure.repository.ts`
- Modify: `apps/backend/src/services/crm/project-closure.service.ts`
- Modify: `apps/backend/src/routes/crm/project-closure.ts`
- Create: `apps/backend/src/services/crm/project-closure.service.test.ts`
- Modify: `apps/backend/src/routes/crm/project-closure.test.ts`

**Interfaces:**

- Produces:

```ts
export async function closeAndArchiveProject(
  projectId: string,
  input: CloseProjectInput,
  actorId: string,
  idempotencyKey: string,
): Promise<ClosureResult>

export async function restoreClosedProject(
  projectId: string,
  actorId: string,
): Promise<RestoreResult>

export async function createFollowUpProject(
  archivedProjectId: string,
  actorId: string,
): Promise<Record<string, unknown>>
```

- [ ] **Step 1: Write failing orchestration tests with a fake repository**

The fake records transaction calls and can throw at a chosen step. Test:

- project lock is acquired before reloading the snapshot;
- stale version or fingerprint fails with `CLOSURE_PREVIEW_STALE`;
- every open invoice is resolved exactly once;
- a thrown child update produces no committed fake state;
- repeated idempotency key returns the first result;
- a different payload with the same key returns `IDEMPOTENCY_CONFLICT`;
- restore succeeds only for a restorable operation;
- restore replays only items created by the selected closure operation and does
  not restore children archived independently before closure;
- restore fails after `credit_note` or `bad_debt`;
- follow-up creation requires a sealed archive, creates a fresh reference,
  persists `predecessor_project_id`, copies only client, organisation, service
  and descriptive context, and copies no document or financial record.

- [ ] **Step 2: Run RED tests**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure.service.test.ts
```

- [ ] **Step 3: Implement the transaction repository**

Inside `db.transaction(async (tx) => ...)`:

1. lock with `tx.execute(sql\`SELECT id FROM crm_projects WHERE id = ... FOR UPDATE\`)`;
2. reload snapshot through the transaction handle;
3. create the operation row;
4. insert invoice adjustments;
5. update document archive metadata;
6. cancel open tasks and reminders;
7. insert closure item rows for every effect and preserved entity;
8. update the project last;
9. insert the activity log inside the same transaction.

Do not call the existing non-transactional `logActivity()` helper from this
path.

- [ ] **Step 4: Implement idempotency**

Store `idempotency_key` and `request_hash` on the closure operation with a
unique index. A repeated identical request returns the stored summary. A
different request hash returns `IDEMPOTENCY_CONFLICT`.

- [ ] **Step 5: Implement route error mapping**

Map domain errors exactly:

```ts
PROJECT_ARCHIVED -> 409
PROJECT_ALREADY_CLOSED -> 409
CLOSURE_PREVIEW_STALE -> 409
INVOICE_RESOLUTION_REQUIRED -> 422
INVOICE_RESOLUTION_MISMATCH -> 422
CREDIT_NOTE_REFERENCE_REQUIRED -> 422
PROJECT_RESTORE_FORBIDDEN -> 409
IDEMPOTENCY_CONFLICT -> 409
```

Reject missing/invalid `Idempotency-Key` with `400`.

Expose `POST /projects/:id/create-follow-up`. It requires a sealed archive,
creates a new active project with a fresh reference and
`predecessor_project_id`, and never copies documents or financial movements.

- [ ] **Step 6: Verify GREEN**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure.service.test.ts src/routes/crm/project-closure.test.ts
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
```

- [ ] **Step 7: Commit**

```powershell
git add -- apps/backend/src/services/crm/project-closure.repository.ts apps/backend/src/services/crm/project-closure.service.ts apps/backend/src/services/crm/project-closure.service.test.ts apps/backend/src/routes/crm/project-closure.ts apps/backend/src/routes/crm/project-closure.test.ts
git commit -m "feat(crm): close project folders atomically"
```

---

### Task 5: Verrouillage transversal des dossiers archivés

**Files:**

- Create: `apps/backend/src/services/crm/project-write-guard.ts`
- Create: `apps/backend/src/services/crm/project-write-guard.test.ts`
- Modify: `apps/backend/src/routes/crm/projects.ts`
- Modify: `apps/backend/src/routes/crm/tasks.ts`
- Modify: `apps/backend/src/routes/crm/deliverables.ts`
- Modify: `apps/backend/src/routes/crm/devis.ts`
- Modify: `apps/backend/src/routes/crm/invoices.ts`
- Modify: `apps/backend/src/routes/crm/contracts.ts`
- Modify: `apps/backend/src/routes/crm/reminders.ts`
- Modify: `apps/backend/src/routes/crm/treasury.ts`
- Modify: `apps/backend/src/services/crm/project.service.ts`
- Modify: `apps/backend/src/services/crm/task.service.ts`
- Modify: `apps/backend/src/services/crm/deliverable.service.ts`
- Modify: `apps/backend/src/services/crm/expense.service.ts`
- Modify: `apps/backend/src/services/crm/devis.service.ts`
- Modify: `apps/backend/src/services/crm/invoice.service.ts`
- Modify: `apps/backend/src/services/crm/payment.service.ts`
- Modify: `apps/backend/src/services/crm/contract.service.ts`
- Modify: `apps/backend/src/services/crm/reminder.service.ts`
- Modify: `apps/backend/src/services/crm/treasury.service.ts`

**Interfaces:**

- Produces:

```ts
export class ProjectArchivedError extends Error {
  readonly code = 'PROJECT_ARCHIVED'
}

export async function assertProjectWritable(projectId: string): Promise<void>
export async function assertInvoiceProjectWritable(invoiceId: string): Promise<void>
export async function assertEntityProjectWritable(
  entity: 'devis' | 'invoice' | 'contract' | 'task' | 'deliverable' | 'reminder' | 'treasury',
  entityId: string,
): Promise<void>
```

- [ ] **Step 1: Write failing guard tests**

Test:

- active project permits mutation;
- archived project throws `ProjectArchivedError`;
- invoice payment resolves its project through invoice;
- reminder resolves direct project first, then invoice project;
- unlinked invoice/devis/contract remains writable;
- treasury movement linked to an archived project is immutable.

- [ ] **Step 2: Run RED**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-write-guard.test.ts
```

- [ ] **Step 3: Implement service-level guards**

Add the guard before every write. Route-only guards are insufficient because
internal service calls must also be protected.

The old `DELETE /projects/:id` must no longer archive directly. Return:

```json
{
  "error": "PROJECT_CLOSURE_REQUIRED",
  "message": "Utilisez l’assistant Clore et archiver le dossier."
}
```

with `409`.

- [ ] **Step 4: Add representative route tests**

Use Hono requests to prove archived project refusal for:

- project patch;
- task creation/update/delete;
- deliverable and metric mutation;
- expense creation;
- invoice edit/payment;
- devis send/convert;
- contract edit/sign;
- reminder creation/update;
- treasury create/update/delete.

All return `409 PROJECT_ARCHIVED`. GET/PDF/download routes remain readable.

- [ ] **Step 5: Verify structural coverage**

Run a search across CRM mutation handlers for writes involving `projectId` and
confirm each path calls a guarded service. Document intentionally unlinked
entities.

- [ ] **Step 6: Verify GREEN**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-write-guard.test.ts src/routes/crm/project-closure.test.ts
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
```

- [ ] **Step 7: Commit**

```powershell
git add -- apps/backend/src/services/crm/project-write-guard.ts apps/backend/src/services/crm/project-write-guard.test.ts apps/backend/src/routes/crm/projects.ts apps/backend/src/routes/crm/tasks.ts apps/backend/src/routes/crm/deliverables.ts apps/backend/src/routes/crm/devis.ts apps/backend/src/routes/crm/invoices.ts apps/backend/src/routes/crm/contracts.ts apps/backend/src/routes/crm/reminders.ts apps/backend/src/routes/crm/treasury.ts apps/backend/src/services/crm/project.service.ts apps/backend/src/services/crm/task.service.ts apps/backend/src/services/crm/deliverable.service.ts apps/backend/src/services/crm/expense.service.ts apps/backend/src/services/crm/devis.service.ts apps/backend/src/services/crm/invoice.service.ts apps/backend/src/services/crm/payment.service.ts apps/backend/src/services/crm/contract.service.ts apps/backend/src/services/crm/reminder.service.ts apps/backend/src/services/crm/treasury.service.ts
git commit -m "fix(crm): freeze archived project folders"
```

Before committing, inspect `git diff --cached --name-only` and unstage any
unrelated CRM file.

---

### Task 6: Rapports, créances et régularisation des archives historiques

**Files:**

- Modify: `apps/backend/src/services/crm/dashboard.service.ts`
- Modify: `apps/backend/src/services/crm/reports.service.ts`
- Modify: `apps/backend/src/services/crm/project-closure.service.ts`
- Modify: `apps/backend/src/services/crm/project-closure.repository.ts`
- Modify: `apps/backend/src/routes/crm/project-closure.ts`
- Create: `apps/backend/src/services/crm/project-closure-reporting.test.ts`

**Interfaces:**

- Produces:

```ts
export async function listArchiveReconciliation(): Promise<ArchiveReconciliationRow[]>
export async function reconcileLegacyArchive(
  projectId: string,
  input: CloseProjectInput,
  actorId: string,
  idempotencyKey: string,
): Promise<ClosureResult>
```

- [ ] **Step 1: Write failing reporting tests**

Given gross invoice 500000, payment 200000, credit note 100000 and bad debt
200000, assert:

```ts
grossInvoiced === 500000
cashCollected === 200000
creditNotes === 100000
badDebt === 200000
collectibleOutstanding === 0
```

Also assert archived projects are excluded from operational pipeline, open
tasks and reminder suggestions, while historical cash, expenses and treasury
remain included.

- [ ] **Step 2: Run RED**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure-reporting.test.ts
```

- [ ] **Step 3: Implement explicit report scopes**

Do not globally add `is_archived = false` to cash-flow queries. Apply:

- operational queries: active projects only;
- collectible receivables: invoice remaining minus credit note and bad debt;
- cash and expenses: all realized historical rows;
- separate totals for credit notes and bad debt.

- [ ] **Step 4: Implement legacy reconciliation listing**

List projects where:

```sql
crm_projects.is_archived = true
AND NOT EXISTS (
  SELECT 1 FROM crm_project_closure_operations
  WHERE project_id = crm_projects.id AND status = 'completed'
)
```

Return child counts and unresolved invoice totals. Reuse the normal closure
transaction after allowing the legacy archived project to be locked and
regularized.

- [ ] **Step 5: Verify GREEN**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test src/services/crm/project-closure-reporting.test.ts src/services/crm/project-closure.service.test.ts
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
```

- [ ] **Step 6: Commit**

```powershell
git add -- apps/backend/src/services/crm/dashboard.service.ts apps/backend/src/services/crm/reports.service.ts apps/backend/src/services/crm/project-closure.service.ts apps/backend/src/services/crm/project-closure.repository.ts apps/backend/src/routes/crm/project-closure.ts apps/backend/src/services/crm/project-closure-reporting.test.ts
git commit -m "fix(crm): reconcile archived project reporting"
```

---

### Task 7: Assistant CRM, dossier historique et parité BFF

**Files:**

- Create: `apps/crm/lib/project-closure.ts`
- Create: `apps/crm/lib/project-closure.test.ts`
- Create: `apps/crm/components/projects/ProjectClosureWizard.tsx`
- Create: `apps/crm/components/projects/ProjectArchivedBanner.tsx`
- Create: `apps/crm/components/projects/ProjectArchiveReconciliation.tsx`
- Modify: `apps/crm/app/(protected)/projects/[id]/page.tsx`
- Modify: `apps/crm/app/(protected)/projects/page.tsx`
- Modify: `apps/crm/lib/rbac.ts`
- Modify: `apps/crm/lib/rbac.test.ts`

**Interfaces:**

- Consumes backend `ClosurePreview` and closure error codes.
- Produces:

```ts
export function validateClosureDraft(
  preview: ClosurePreview,
  draft: ClosureDraft,
): ClosureDraftValidation

export function newIdempotencyKey(): string
```

- [ ] **Step 1: Write failing UI-domain and BFF tests**

Test:

- manage permission required for preview and closure BFF paths;
- incomplete invoice resolution disables submit;
- resolution amount must equal remaining balance;
- credit note requires external reference;
- final typed project reference must match exactly;
- archived project renders no mutation action model;
- sealed archive renders “Créer un nouveau projet lié” and no restore action;
- follow-up creation posts to the manage-only endpoint and navigates to the
  newly created project;
- a follow-up project detail links back to its predecessor;
- legacy archive exposes reconciliation action only.

- [ ] **Step 2: Run RED**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test ../crm/lib/project-closure.test.ts ../crm/lib/rbac.test.ts
```

- [ ] **Step 3: Implement the four-step wizard**

Steps:

1. impact;
2. closure type and minimum ten-character reason;
3. one resolution card per open invoice;
4. summary plus exact project reference confirmation.

Use semantic buttons, visible labels, `aria-live` error feedback and keyboard
focus on the first invalid field. Do not use `prompt()` or `confirm()`.

POST with:

```ts
await crmPost(`projects/${projectId}/close-and-archive`, payload, {
  'Idempotency-Key': idempotencyKey,
})
```

If the generic API helper cannot accept headers, add a focused
`closeProjectFolder()` helper instead of weakening the generic API type.

- [ ] **Step 4: Implement archived read-only presentation**

Replace archive/edit/status/close actions with `ProjectArchivedBanner`.
Keep tabs and downloads. Add “Documents historiques” grouping:

- devis;
- invoices and adjustments;
- payments and receipts;
- contracts.

For a sealed archive, expose “Créer un nouveau projet lié”. POST to
`projects/${projectId}/create-follow-up`, then navigate to the new project.
Never expose restore for a sealed archive. On the new project detail, show a
read-only link back to the predecessor.

- [ ] **Step 5: Implement reconciliation UI**

On the projects archive section, show a badge and action for
`requires_reconciliation`. Open the same wizard with reconciliation endpoint
and existing archived state.

- [ ] **Step 6: Verify GREEN and build**

```powershell
corepack pnpm --dir apps/backend exec node --import tsx --test ../crm/lib/project-closure.test.ts ../crm/lib/rbac.test.ts
corepack pnpm --filter @scoop-afrique/crm run build
corepack pnpm --filter @scoop-afrique/crm run lint
git diff --check
```

Expected: tests/build PASS; lint has no new error or warning in modified files.

- [ ] **Step 7: Commit**

```powershell
git add -- apps/crm/lib/project-closure.ts apps/crm/lib/project-closure.test.ts apps/crm/components/projects/ProjectClosureWizard.tsx apps/crm/components/projects/ProjectArchivedBanner.tsx apps/crm/components/projects/ProjectArchiveReconciliation.tsx 'apps/crm/app/(protected)/projects/[id]/page.tsx' 'apps/crm/app/(protected)/projects/page.tsx' apps/crm/lib/rbac.ts apps/crm/lib/rbac.test.ts
git commit -m "feat(crm): add project closure assistant"
```

---

### Task 8: Documentation, vérification finale et préparation de migration

**Files:**

- Create: `docs/CRM_PROJECT_CLOSURE_RUNBOOK.md`
- Verify: all Task 1–7 files

**Interfaces:**

- Produces a reproducible migration and reconciliation runbook.

- [ ] **Step 1: Write the operational runbook**

Document:

- backup required before migration;
- migration remains unapplied in this branch;
- reconcile the pre-existing Drizzle journal gap for migrations `0048`–`0060`
  against the target database before applying `0061`;
- schema verification queries;
- expected legacy reconciliation count;
- smoke accounts and permissions;
- rollback response if code deploy fails before data regularization;
- no rollback of issued credit notes through database edits.

- [ ] **Step 2: Run all automated verification**

```powershell
corepack pnpm --filter @scoop-afrique/backend run test
corepack pnpm --filter @scoop-afrique/backend run build
corepack pnpm --filter @scoop-afrique/backend run lint
corepack pnpm --filter @scoop-afrique/crm run build
corepack pnpm --filter @scoop-afrique/crm run lint
git diff --check
```

- [ ] **Step 3: Verify migration text without applying it**

Check:

- no destructive SQL;
- RLS enabled on new public tables;
- no grants to `anon`/`authenticated`;
- service role policies exist;
- no child archive backfill;
- indexes cover operation project ID, idempotency key, adjustment invoice ID
  and closure item operation ID.

- [ ] **Step 4: Verify representative access matrix**

Run targeted backend and BFF tests proving:

- reader/writer cannot preview or close;
- manager can preview and close;
- archived project rejects writes with `409`;
- historical GET/PDF remains accessible under existing archive visibility;
- no role fallback.

- [ ] **Step 5: Inspect Git scope**

```powershell
git status --short
git diff --stat
git diff --name-only
```

Confirm user untracked files are preserved and no remote migration/deployment
occurred.

- [ ] **Step 6: Commit**

```powershell
git add -- docs/CRM_PROJECT_CLOSURE_RUNBOOK.md
git commit -m "docs(crm): document project closure operations"
```

---

## Final Review Gate

After Task 8:

1. create one review package from the commit before Task 1 to final HEAD;
2. dispatch a fresh security/data-integrity reviewer;
3. fix every Critical or Important finding in one bounded final wave;
4. rerun backend tests, backend build, CRM build and migration structural tests;
5. leave `dev` and the working directory intact;
6. do not push, deploy or apply the database migration without a separate user instruction.
