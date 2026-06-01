import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PdfPaymentMethods, type PdfPaymentMethod } from './PdfPaymentMethods.js'

const BRAND = '#B91C1C'
const TEXT = '#111827'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const ROW_ALT = '#F9FAFB'

export interface DevisIssuer {
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
  unit?: string
  total: number
}

interface DevisData {
  reference: string
  title: string
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
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  valid_until?: string
  notes?: string
}

function fmtNum(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
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
  /* ── Object ── */
  objectRow: { flexDirection: 'row', marginBottom: 12 },
  objectLabel: { fontSize: 8.5, color: MUTED, marginRight: 4 },
  objectValue: { fontSize: 8.5, fontWeight: 'bold', color: TEXT, flex: 1 },
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
  tdMuted: { fontSize: 7, color: MUTED, marginTop: 1 },
  colDesc: { flex: 4 },
  colQty: { width: 38, textAlign: 'right' },
  colPrice: { width: 75, textAlign: 'right' },
  colTotal: { width: 82, textAlign: 'right' },
  /* ── Totals ── */
  totalsOuter: { alignItems: 'flex-end', marginTop: 10 },
  totalsBox: { width: 240, borderWidth: 0.5, borderColor: BORDER },
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
  totalLabel: { fontSize: 8.5, color: MUTED },
  totalValue: { fontSize: 8.5, color: TEXT },
  totalLabelFinal: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
  totalValueFinal: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF' },
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

export function DevisTemplate({
  devis,
  paymentMethods = [],
  issuer,
}: {
  devis: DevisData
  paymentMethods?: PdfPaymentMethod[]
  issuer?: DevisIssuer
}) {
  const company: DevisIssuer = issuer ?? {
    name: 'Scoop Afrique',
    address: "Abidjan, Cocody Riviera Faya, Côte d'Ivoire",
    phone: '+225 07 69 96 68 00',
    email: 'contact@scoop-afrique.com',
  }
  const contact = devis.contact
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''

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
            <Text style={styles.docType}>DEVIS</Text>
            <Text style={styles.docRef}>{devis.reference}</Text>
            <Text style={styles.docMeta}>Émis le {fmtDate(new Date().toISOString())}</Text>
            {devis.valid_until && (
              <Text style={styles.docMeta}>Valable jusqu'au {fmtDate(devis.valid_until)}</Text>
            )}
          </View>
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
            <Text style={styles.partyLabel}>DESTINATAIRE</Text>
            {contactName ? (
              <Text style={styles.partyName}>{contactName}</Text>
            ) : (
              <Text style={styles.partyName}>{devis.title}</Text>
            )}
            {contact?.company && <Text style={styles.partyLine}>{contact.company}</Text>}
            {contact?.email && <Text style={styles.partyLine}>{contact.email}</Text>}
            {contact?.phone && <Text style={styles.partyLine}>{contact.phone}</Text>}
          </View>
        </View>

        {/* Object */}
        <View style={styles.objectRow}>
          <Text style={styles.objectLabel}>Objet :</Text>
          <Text style={styles.objectValue}>{devis.title}</Text>
        </View>

        {/* Line items table */}
        <View>
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDesc}><Text style={styles.thCell}>Désignation / Prestation</Text></View>
            <View style={styles.colQty}><Text style={[styles.thCell, { textAlign: 'right' }]}>Qté</Text></View>
            <View style={styles.colPrice}><Text style={[styles.thCell, { textAlign: 'right' }]}>Prix unit.</Text></View>
            <View style={styles.colTotal}><Text style={[styles.thCell, { textAlign: 'right' }]}>Total HT</Text></View>
          </View>
          {(devis.line_items || []).map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <View style={styles.colDesc}>
                <Text style={styles.tdCell}>{item.description}</Text>
                {item.unit && item.unit !== 'unité' && (
                  <Text style={styles.tdMuted}>{item.unit}</Text>
                )}
              </View>
              <View style={styles.colQty}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{item.quantity}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{fmtMoney(item.unit_price, devis.currency)}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={[styles.tdCell, { textAlign: 'right' }]}>{fmtMoney(item.total, devis.currency)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsOuter}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total HT</Text>
              <Text style={styles.totalValue}>{fmtMoney(devis.subtotal, devis.currency)}</Text>
            </View>
            {devis.tax_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA ({devis.tax_rate}%)</Text>
                <Text style={styles.totalValue}>{fmtMoney(devis.tax_amount, devis.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>TOTAL TTC</Text>
              <Text style={styles.totalValueFinal}>{fmtMoney(devis.total, devis.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Payment methods */}
        <PdfPaymentMethods methods={paymentMethods} isDevis />

        {/* Notes */}
        {devis.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <Text style={styles.notesText}>{devis.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company.name} — {devis.reference} — Document confidentiel</Text>
          <Text style={styles.footerText}>{company.phone} — {company.email}</Text>
        </View>
      </Page>
    </Document>
  )
}
