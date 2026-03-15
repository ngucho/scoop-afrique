/**
 * CRM PDF service — generates Devis, Invoice, Receipt, Contract PDFs.
 */
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { getSupabase } from '../../lib/supabase.js'
import { config } from '../../config/env.js'
import { DevisTemplate } from '../../pdf-templates/DevisTemplate.js'
import { InvoiceTemplate } from '../../pdf-templates/InvoiceTemplate.js'
import { ReceiptTemplate } from '../../pdf-templates/ReceiptTemplate.js'
import { ContractTemplate } from '../../pdf-templates/ContractTemplate.js'

const PDF_STORAGE_BUCKET = process.env.PDF_STORAGE_BUCKET ?? 'crm-documents'

export async function renderPdfToBuffer(doc: React.ReactElement): Promise<Buffer> {
  const buffer = await renderToBuffer(doc as Parameters<typeof renderToBuffer>[0])
  return Buffer.from(buffer)
}

export async function renderDevisPdf(devis: Record<string, unknown>): Promise<Buffer> {
  const contact = devis.crm_contacts as Record<string, unknown> | null
  const doc = React.createElement(DevisTemplate, {
    devis: {
        reference: devis.reference as string,
        title: devis.title as string,
        contact: contact
          ? {
              first_name: contact.first_name as string,
              last_name: contact.last_name as string,
              email: contact.email as string,
              phone: contact.phone as string,
              company: contact.company as string,
            }
          : undefined,
        line_items: ((devis.line_items as Array<Record<string, unknown>>) ?? []).map((i) => ({
          description: (i.description as string) ?? '',
          quantity: (i.quantity as number) ?? 0,
          unit_price: (i.unit_price as number) ?? 0,
          unit: (i.unit as string) ?? 'unité',
          total: (i.total as number) ?? 0,
        })),
        subtotal: (devis.subtotal as number) ?? 0,
        tax_rate: (devis.tax_rate as number) ?? 0,
        tax_amount: (devis.tax_amount as number) ?? 0,
        total: (devis.total as number) ?? 0,
        currency: (devis.currency as string) ?? 'FCFA',
        valid_until: devis.valid_until as string,
        notes: devis.notes as string,
      },
  })
  return renderPdfToBuffer(doc)
}

export async function renderInvoicePdf(invoice: Record<string, unknown>): Promise<Buffer> {
  const contact = invoice.crm_contacts as Record<string, unknown> | null
  const doc = React.createElement(InvoiceTemplate, {
    invoice: {
        reference: invoice.reference as string,
        contact: contact
          ? {
              first_name: contact.first_name as string,
              last_name: contact.last_name as string,
              email: contact.email as string,
              company: contact.company as string,
            }
          : undefined,
        line_items: ((invoice.line_items as Array<Record<string, unknown>>) ?? []).map((i) => ({
          description: (i.description as string) ?? '',
          quantity: (i.quantity as number) ?? 0,
          unit_price: (i.unit_price as number) ?? 0,
          total: (i.total as number) ?? 0,
        })) as Array<{ description: string; quantity: number; unit_price: number; total: number }>,
        subtotal: (invoice.subtotal as number) ?? 0,
        discount_amount: (invoice.discount_amount as number) ?? 0,
        tax_rate: (invoice.tax_rate as number) ?? 0,
        tax_amount: (invoice.tax_amount as number) ?? 0,
        total: (invoice.total as number) ?? 0,
        amount_paid: (invoice.amount_paid as number) ?? 0,
        currency: (invoice.currency as string) ?? 'FCFA',
        due_date: invoice.due_date as string,
        notes: invoice.notes as string,
      },
  })
  return renderPdfToBuffer(doc)
}

export async function renderReceiptPdf(
  payment: Record<string, unknown>,
  invoice?: Record<string, unknown>,
  contact?: Record<string, unknown>
): Promise<Buffer> {
  const doc = React.createElement(ReceiptTemplate, {
    receipt: {
        payment: {
          id: payment.id as string,
          amount: payment.amount as number,
          currency: (payment.currency as string) ?? 'FCFA',
          method: (payment.method as string) ?? 'other',
          reference: payment.reference as string,
          paid_at: payment.paid_at as string,
        },
        invoice: invoice ? { reference: invoice.reference as string } : undefined,
        contact: contact
          ? {
              first_name: contact.first_name as string,
              last_name: contact.last_name as string,
              company: contact.company as string,
            }
          : undefined,
      },
  })
  return renderPdfToBuffer(doc)
}

export async function renderContractPdf(contract: Record<string, unknown>): Promise<Buffer> {
  const contact = contract.crm_contacts as Record<string, unknown> | null
  const doc = React.createElement(ContractTemplate, {
    contract: {
        reference: contract.reference as string,
        title: contract.title as string,
        type: (contract.type as string) ?? 'service',
        content: (contract.content as Record<string, unknown>) ?? {},
        contact: contact
          ? {
              first_name: contact.first_name as string,
              last_name: contact.last_name as string,
              company: contact.company as string,
            }
          : undefined,
        expires_at: contract.expires_at as string,
        signed_at: contract.signed_at as string,
      },
  })
  return renderPdfToBuffer(doc)
}

export async function uploadPdfToStorage(
  buffer: Buffer,
  path: string,
  contentType = 'application/pdf'
): Promise<string | null> {
  if (!config.supabase) return null

  const supabase = getSupabase()
  const { error } = await supabase.storage.from(PDF_STORAGE_BUCKET).upload(path, buffer, {
    contentType,
    upsert: true,
  })
  if (error) {
    console.error('[crm-pdf] Storage upload error:', error)
    return null
  }

  const { data: urlData } = supabase.storage.from(PDF_STORAGE_BUCKET).getPublicUrl(path)
  return urlData?.publicUrl ?? null
}
