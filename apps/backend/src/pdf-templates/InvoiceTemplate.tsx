import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PdfPaymentMethods, type PdfPaymentMethod } from './PdfPaymentMethods.js'

const BRAND = '#B91C1C'
const TEXT = '#111827'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const ROW_ALT = '#F9FAFB'
const PAID_COLOR = '#065F46'
const PAID_BG = '#D1FAE5'
const DUE_COLOR = '#7C3AED'
const DUE_BG = '#EDE9FE'

export interface InvoiceIssuer {
  name: string
  address?: string
  email?: string
  phone?: string
  website?: string
  rccm?: string
}

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface InvoiceData {
  reference: string
  contact?: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
    company?: string
  }
  project?: {
    reference?: string
    title?: string
    description?: string
    start_date?: string
    end_date?: string
  }
  line_items: LineItem[]
  subtotal: number
  discount_amount?: number
  tax_rate: number
  tax_amount: number
  total: number
  amount_paid: number
  currency: string
  due_date?: string
  notes?: string
}

function fmtNum(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
function fmtMoney(amount: number, currency: string): string {
  return `${fmtNum(amount)} ${currency}`
}
function fmtDate(d?: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return d
  }
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingTop: 30,
    paddingBottom: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: TEXT,
    backgroundColor: '#FFFFFF',
  },
  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
  },
  companyName: { fontSize: 15, fontWeight: 'bold', color: BRAND, marginBottom: 3 },
  companyLine: { fontSize: 7.5, color: MUTED, marginBottom: 1.5 },
  docTypeBox: { alignItems: 'flex-end' },
  docType: { fontSize: 20, fontWeight: 'bold', color: BRAND },
  docRef: { fontSize: 9.5, fontWeight: 'bold', color: TEXT, marginTop: 3 },
  docMeta: { fontSize: 8, color: MUTED, marginTop: 2 },
  /* ── Status badge ── */
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  badgePaid: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: PAID_BG,
    borderRadius: 4,
  },
  badgePaidText: { fontSize: 8.5, fontWeight: 'bold', color: PAID_COLOR },
  badgeDue: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: DUE_BG,
    borderRadius: 4,
  },
  badgeDueText: { fontSize: 8.5, fontWeight: 'bold', color: DUE_COLOR },
  /* ── Parties ── */
  partiesRow: { flexDirection: 'row', marginBottom: 14 },
  partyBox: { flex: 1, padding: 10, backgroundColor: ROW_ALT, borderWidth: 0.5, borderColor: BORDER },
  partyBoxDest: {
    flex: 1,
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#FFF5F5',
    borderWidth: 0.5,
    borderColor: '#FCA5A5',
  },
  partyLabel: { fontSize: 7, fontWeight: 'bold', color: BRAND, marginBottom: 4 },
  partyName: { fontSize: 9.5, fontWeight: 'bold', color: TEXT, marginBottom: 2 },
  partyLine: { fontSize: 8, color: MUTED, marginBottom: 1.5 },
  /* ── Table ── */
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  thCell: { fontSize: 8, fontWeight: 'bold', color: '#FFFFFF' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableRowAlt: { backgroundColor: ROW_ALT },
  tdCell: { fontSize: 8.5, color: TEXT },
  colDesc: { flex: 4 },
  colQty: { width: 38, textAlign: 'right' },
  colPrice: { width: 75, textAlign: 'right' },
  colTotal: { width: 82, textAlign: 'right' },
  /* ── Totals ── */
  totalsOuter: { alignItems: 'flex-end', marginTop: 10 },
  totalsBox: { width: 250, borderWidth: 0.5, borderColor: BORDER },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BRAND,
  },
  totalRowPaid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: PAID_BG,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  totalRowDue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: DUE_BG,
  },
  totalLabel: { fontSize: 8.5, color: MUTED },
  totalValue: { fontSize: 8.5, color: TEXT },
  totalLabelFinal: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  totalValueFinal: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  totalLabelPaid: { fontSize: 8.5, fontWeight: 'bold', color: PAID_COLOR },
  totalValuePaid: { fontSize: 8.5, fontWeight: 'bold', color: PAID_COLOR },
  totalLabelDue: { fontSize: 9, fontWeight: 'bold', color: DUE_COLOR },
  totalValueDue: { fontSize: 9, fontWeight: 'bold', color: DUE_COLOR },
  /* ── Notes ── */
  notesBox: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderWidth: 0.5,
    borderColor: '#FDE68A',
  },
  notesLabel: { fontSize: 7.5, fontWeight: 'bold', color: '#78350F', marginBottom: 2 },
  notesText: { fontSize: 8.5, color: '#78350F', lineHeight: 1.4 },
  /* ── Footer ── */
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: MUTED },
})

export function InvoiceTemplate({
  invoice,
  paymentMethods = [],
  issuer,
}: {
  invoice: InvoiceData
  paymentMethods?: PdfPaymentMethod[]
  issuer?: InvoiceIssuer
}) {
  const company: InvoiceIssuer = issuer ?? {
    name: 'Scoop Afrique',
    address: "Abidjan, Cocody Riviera Faya, Côte d'Ivoire",
    phone: '+225 07 69 96 68 00',
    email: 'contact@scoop-afrique.com',
  }
  const contact = invoice.contact
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''
  const amountPaid = invoice.amount_paid || 0
  const amountDue = invoice.total - amountPaid
  const isPaid = amountDue <= 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.address && <Text style={styles.companyLine}>{company.address}</Text>}
            {company.phone && <Text style={styles.companyLine}>Tél. {company.phone}</Text>}
            {company.email && <Text style={styles.companyLine}>{company.email}</Text>}
            {company.rccm && <Text style={styles.companyLine}>RCCM : {company.rccm}</Text>}
          </View>
          <View style={styles.docTypeBox}>
            <Text style={styles.docType}>FACTURE</Text>
            <Text style={styles.docRef}>{invoice.reference}</Text>
            <Text style={styles.docMeta}>Émis le {fmtDate(new Date().toISOString())}</Text>
            {invoice.due_date && (
              <Text style={styles.docMeta}>Échéance : {fmtDate(invoice.due_date)}</Text>
            )}
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.badgeRow}>
          {isPaid ? (
            <View style={styles.badgePaid}>
              <Text style={styles.badgePaidText}>PAYÉE</Text>
            </View>
          ) : (
            <View style={styles.badgeDue}>
              <Text style={styles.badgeDueText}>
                SOLDE DÛ : {fmtMoney(amountDue, invoice.currency)}
              </Text>
            </View>
          )}
        </View>

        {/* Parties */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>ÉMETTEUR</Text>
            <Text style={styles.partyName}>{company.name}</Text>
            {company.address && <Text style={styles.partyLine}>{company.address}</Text>}
            {company.phone && <Text style={styles.partyLine}>{company.phone}</Text>}
            {company.email && <Text style={styles.partyLine}>{company.email}</Text>}
          </View>
          <View style={styles.partyBoxDest}>
            <Text style={styles.partyLabel}>FACTURÉ À</Text>
            {contactName ? (
              <Text style={styles.partyName}>{contactName}</Text>
            ) : contact?.company ? (
              <Text style={styles.partyName}>{contact.company}</Text>
            ) : (
              <Text style={styles.partyName}>—</Text>
            )}
            {contact?.company && contactName && <Text style={styles.partyLine}>{contact.company}</Text>}
            {contact?.email && <Text style={styles.partyLine}>{contact.email}</Text>}
            {contact?.phone && <Text style={styles.partyLine}>{contact.phone}</Text>}
          </View>
        </View>

        {/* Projet info (if available) */}
        {invoice.project && (invoice.project.reference || invoice.project.title) && (
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Text style={{ fontSize: 8.5, color: MUTED, marginRight: 4 }}>Projet :</Text>
            <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: TEXT }}>
              {[invoice.project.reference, invoice.project.title].filter(Boolean).join(' — ')}
            </Text>
          </View>
        )}

        {/* Line items table */}
        <View>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDesc}><Text style={styles.thCell}>Désignation / Prestation</Text></View>
            <View style={styles.colQty}><Text style={[styles.thCell, { textAlign: 'right' }]}>Qté</Text></View>
            <View style={styles.colPrice}><Text style={[styles.thCell, { textAlign: 'right' }]}>Prix unit.</Text></View>
            <View style={styles.colTotal}><Text style={[styles.thCell, { textAlign: 'right' }]}>Total HT</Text></View>
          </View>
          {(invoice.line_items || []).map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <View style={styles.colDesc}>
                <Text style={styles.tdCell}>{item.description}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{item.quantity}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{fmtMoney(item.unit_price, invoice.currency)}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{fmtMoney(item.total, invoice.currency)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total HT</Text>
              <Text style={styles.totalValue}>{fmtMoney(invoice.subtotal, invoice.currency)}</Text>
            </View>
            {(invoice.discount_amount ?? 0) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Réduction</Text>
                <Text style={styles.totalValue}>- {fmtMoney(invoice.discount_amount!, invoice.currency)}</Text>
              </View>
            )}
            {invoice.tax_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA ({invoice.tax_rate}%)</Text>
                <Text style={styles.totalValue}>{fmtMoney(invoice.tax_amount, invoice.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL TTC</Text>
              <Text style={styles.totalValueFinal}>{fmtMoney(invoice.total, invoice.currency)}</Text>
            </View>
            {amountPaid > 0 && (
              <View style={styles.totalRowPaid}>
                <Text style={styles.totalLabelPaid}>Déjà payé</Text>
                <Text style={styles.totalValuePaid}>{fmtMoney(amountPaid, invoice.currency)}</Text>
              </View>
            )}
            {amountDue > 0 && (
              <View style={styles.totalRowDue}>
                <Text style={styles.totalLabelDue}>SOLDE DÛ</Text>
                <Text style={styles.totalValueDue}>{fmtMoney(amountDue, invoice.currency)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment methods */}
        <PdfPaymentMethods methods={paymentMethods} isDevis={false} />

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name} — {invoice.reference} — À régler selon conditions convenues</Text>
          <Text style={styles.footerText}>{company.phone} — {company.email}</Text>
        </View>
      </Page>
    </Document>
  )
}
