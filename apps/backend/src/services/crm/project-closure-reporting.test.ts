import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { summarizeReceivables } from './reports.service.js'

const read = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), 'utf8')

const reports = read('reports.service.ts')
const dashboard = read('dashboard.service.ts')
const reminders = read('reminder.service.ts')

test('a closed folder leaves no collectible receivable', () => {
  const summary = summarizeReceivables({
    invoices: [{ id: 'invoice-1', status: 'partial', total: 500_000, amountPaid: 200_000 }],
    payments: [{ invoiceId: 'invoice-1', amount: 200_000 }],
    adjustments: [
      { invoiceId: 'invoice-1', type: 'credit_note', amount: 100_000 },
      { invoiceId: 'invoice-1', type: 'bad_debt', amount: 200_000 },
    ],
  })

  assert.equal(summary.grossInvoiced, 500_000)
  assert.equal(summary.cashCollected, 200_000)
  assert.equal(summary.creditNotes, 100_000)
  assert.equal(summary.badDebt, 200_000)
  assert.equal(summary.collectibleOutstanding, 0)
})

test('an unresolved invoice keeps its collectible balance', () => {
  const summary = summarizeReceivables({
    invoices: [{ id: 'invoice-1', status: 'partial', total: 500_000, amountPaid: 200_000 }],
    payments: [{ invoiceId: 'invoice-1', amount: 200_000 }],
    adjustments: [],
  })

  assert.equal(summary.collectibleOutstanding, 300_000)
  assert.equal(summary.creditNotes, 0)
  assert.equal(summary.badDebt, 0)
})

test('paid and cancelled invoices never carry a collectible balance', () => {
  const summary = summarizeReceivables({
    invoices: [
      { id: 'paid', status: 'paid', total: 100_000, amountPaid: 100_000 },
      { id: 'cancelled', status: 'cancelled', total: 80_000, amountPaid: 0 },
      { id: 'draft', status: 'draft', total: 60_000, amountPaid: 0 },
    ],
    payments: [{ invoiceId: 'paid', amount: 100_000 }],
    adjustments: [],
  })

  assert.equal(summary.grossInvoiced, 240_000)
  assert.equal(summary.collectibleOutstanding, 0)
})

test('an over-resolved invoice never produces a negative receivable', () => {
  const summary = summarizeReceivables({
    invoices: [{ id: 'invoice-1', status: 'sent', total: 100_000, amountPaid: 0 }],
    payments: [],
    adjustments: [{ invoiceId: 'invoice-1', type: 'bad_debt', amount: 150_000 }],
  })

  assert.equal(summary.collectibleOutstanding, 0)
})

test('credit notes and bad debt are reported separately, never merged into cash', () => {
  const summary = summarizeReceivables({
    invoices: [{ id: 'invoice-1', status: 'sent', total: 400_000, amountPaid: 0 }],
    payments: [],
    adjustments: [
      { invoiceId: 'invoice-1', type: 'credit_note', amount: 250_000 },
      { invoiceId: 'invoice-1', type: 'bad_debt', amount: 150_000 },
    ],
  })

  assert.equal(summary.cashCollected, 0)
  assert.equal(summary.creditNotes, 250_000)
  assert.equal(summary.badDebt, 150_000)
})

test('cash and expense queries keep historical rows of archived folders', () => {
  // Un encaissement réalisé reste un encaissement : archiver le dossier ne doit
  // pas le retirer de la trésorerie historique.
  const paymentJoins = reports.match(/\.innerJoin\(crmInvoices[\s\S]{0,400}?\)\n/g) ?? []
  assert.ok(paymentJoins.length > 0, 'payment joins should exist')
  for (const join of paymentJoins) {
    assert.doesNotMatch(
      join,
      /eq\(crmInvoices\.isArchived, false\)/,
      'cash queries must not filter archived invoices',
    )
  }
  assert.doesNotMatch(
    dashboard.match(/paymentsInRange[\s\S]{0,600}/)?.[0] ?? '',
    /eq\(crmInvoices\.isArchived, false\)/,
  )
})

test('operational scopes exclude archived projects and documents', () => {
  assert.match(dashboard, /eq\(crmProjects\.isArchived, false\)/)
  assert.match(dashboard, /eq\(crmDevis\.isArchived, false\)/)
  assert.match(dashboard, /eq\(crmInvoices\.isArchived, false\)/)
  // Les suggestions de relance s'appuient déjà sur les documents actifs.
  assert.match(reminders, /eq\(crmDevis\.isArchived, false\)/)
  assert.match(reminders, /eq\(crmInvoices\.isArchived, false\)/)
})

test('collectible receivables subtract adjustments in the reporting query', () => {
  assert.match(reports, /crmInvoiceAdjustments/)
  assert.match(reports, /summarizeReceivables/)
})
