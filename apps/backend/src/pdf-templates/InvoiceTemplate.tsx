import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PdfHeader } from './PdfHeader.js'
import { PdfPaymentMethods } from './PdfPaymentMethods.js'

const BRAND = '#B91C1C'
const TEXT = '#1a1a1a'
const MUTED = '#555'
const BORDER = '#d1d5db'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: TEXT,
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: BRAND,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: { width: 100, color: MUTED },
  value: { flex: 1, color: TEXT },
  table: { marginTop: 15, marginBottom: 15 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 6,
    marginBottom: 6,
    fontWeight: 'bold',
    color: BRAND,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  colDesc: { flex: 3, color: TEXT },
  colQty: { width: 50, textAlign: 'right', color: TEXT },
  colPrice: { width: 80, textAlign: 'right', color: TEXT },
  colTotal: { width: 90, textAlign: 'right', color: TEXT },
  totals: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 220,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalValue: { fontWeight: 'bold', color: BRAND },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
  },
})

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

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export function InvoiceTemplate({ invoice }: { invoice: InvoiceData }) {
  const contact = invoice.contact
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''
  const amountDue = invoice.total - (invoice.amount_paid || 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader docTitle={`Facture ${invoice.reference}`} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facture</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Référence:</Text>
            <Text style={styles.value}>{invoice.reference}</Text>
          </View>
          {invoice.due_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Échéance:</Text>
              <Text style={styles.value}>{invoice.due_date}</Text>
            </View>
          )}
        </View>

        {(contactName || contact?.company || contact?.email || contact?.phone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            {contactName && (
              <View style={styles.row}>
                <Text style={styles.label}>Nom:</Text>
                <Text style={styles.value}>{contactName}</Text>
              </View>
            )}
            {contact?.company && (
              <View style={styles.row}>
                <Text style={styles.label}>Société:</Text>
                <Text style={styles.value}>{contact.company}</Text>
              </View>
            )}
            {contact?.email && (
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{contact.email}</Text>
              </View>
            )}
            {contact?.phone && (
              <View style={styles.row}>
                <Text style={styles.label}>Téléphone:</Text>
                <Text style={styles.value}>{contact.phone}</Text>
              </View>
            )}
          </View>
        )}

        {invoice.project && (invoice.project.reference || invoice.project.title) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projet</Text>
            {invoice.project.reference && (
              <View style={styles.row}>
                <Text style={styles.label}>Référence:</Text>
                <Text style={styles.value}>{invoice.project.reference}</Text>
              </View>
            )}
            {invoice.project.title && (
              <View style={styles.row}>
                <Text style={styles.label}>Titre:</Text>
                <Text style={styles.value}>{invoice.project.title}</Text>
              </View>
            )}
            {invoice.project.description && (
              <View style={styles.row}>
                <Text style={styles.label}>Description:</Text>
                <Text style={[styles.value, { flex: 2 }]}>{invoice.project.description}</Text>
              </View>
            )}
            {(invoice.project.start_date || invoice.project.end_date) && (
              <View style={styles.row}>
                <Text style={styles.label}>Période:</Text>
                <Text style={styles.value}>
                  {invoice.project.start_date || '—'} — {invoice.project.end_date || '—'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {(invoice.line_items || []).map((item: LineItem, i: number) => (
            <React.Fragment key={i}>
              <View style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatMoney(item.unit_price, invoice.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatMoney(item.total, invoice.currency)}
              </Text>
            </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Sous-total:</Text>
            <Text style={styles.totalValue}>
              {formatMoney(invoice.subtotal, invoice.currency)}
            </Text>
          </View>
          {(invoice.discount_amount ?? 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Réduction:</Text>
              <Text style={styles.totalValue}>
                -{formatMoney(invoice.discount_amount!, invoice.currency)}
              </Text>
            </View>
          )}
          {invoice.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>TVA ({invoice.tax_rate}%):</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.tax_amount, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatMoney(invoice.total, invoice.currency)}
            </Text>
          </View>
          {(invoice.amount_paid || 0) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Payé:</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.amount_paid, invoice.currency)}
              </Text>
            </View>
          )}
          {amountDue > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.label}>Solde dû:</Text>
              <Text style={styles.totalValue}>
                {formatMoney(amountDue, invoice.currency)}
              </Text>
            </View>
          )}
        </View>

        <PdfPaymentMethods isDevis={false} />

        {invoice.notes && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          SCOOP — Facture {invoice.reference} — À régler selon conditions convenues — (+225) 07 02 90 79 49 — contact@scoop-afrique.com
        </Text>
      </Page>
    </Document>
  )
}
