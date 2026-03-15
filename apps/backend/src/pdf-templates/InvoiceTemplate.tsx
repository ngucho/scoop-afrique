import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: { width: 100, color: '#666' },
  value: { flex: 1 },
  table: { marginTop: 15, marginBottom: 15 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  colDesc: { flex: 3 },
  colQty: { width: 50, textAlign: 'right' },
  colPrice: { width: 80, textAlign: 'right' },
  colTotal: { width: 90, textAlign: 'right' },
  totals: {
    marginTop: 20,
    marginLeft: 'auto',
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalValue: { fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
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
    company?: string
  }
  line_items: LineItem[]
  subtotal: number
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
        <View style={styles.header}>
          <Text style={styles.title}>SCOOP AFRIQUE</Text>
          <Text style={styles.subtitle}>SARL au capital de 1 000 000 FCFA</Text>
          <Text style={styles.subtitle}>Siège : Abidjan Cocody Riviera Faya — 01 BP 130 Abidjan 01</Text>
          <Text style={styles.subtitle}>Facture {invoice.reference}</Text>
        </View>

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

        {contactName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nom:</Text>
              <Text style={styles.value}>{contactName}</Text>
            </View>
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

        {invoice.notes && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Scoop Afrique — Facture {invoice.reference} — À régler selon conditions convenues
        </Text>
      </Page>
    </Document>
  )
}
