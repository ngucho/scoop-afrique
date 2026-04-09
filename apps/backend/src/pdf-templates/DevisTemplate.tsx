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
  label: {
    width: 100,
    color: MUTED,
  },
  value: {
    flex: 1,
    color: TEXT,
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
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
  totalLabel: { color: MUTED },
  totalValue: {
    fontWeight: 'bold',
    color: BRAND,
  },
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

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

export function DevisTemplate({ devis }: { devis: DevisData }) {
  const contact = devis.contact
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader docTitle={`Devis ${devis.reference}`} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Devis</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Référence:</Text>
            <Text style={styles.value}>{devis.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Titre:</Text>
            <Text style={styles.value}>{devis.title}</Text>
          </View>
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

        {devis.project && (devis.project.reference || devis.project.title) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projet</Text>
            {devis.project.reference && (
              <View style={styles.row}>
                <Text style={styles.label}>Référence:</Text>
                <Text style={styles.value}>{devis.project.reference}</Text>
              </View>
            )}
            {devis.project.title && (
              <View style={styles.row}>
                <Text style={styles.label}>Titre:</Text>
                <Text style={styles.value}>{devis.project.title}</Text>
              </View>
            )}
            {devis.project.description && (
              <View style={styles.row}>
                <Text style={styles.label}>Description:</Text>
                <Text style={[styles.value, { flex: 2 }]}>{devis.project.description}</Text>
              </View>
            )}
            {(devis.project.start_date || devis.project.end_date) && (
              <View style={styles.row}>
                <Text style={styles.label}>Période:</Text>
                <Text style={styles.value}>
                  {devis.project.start_date || '—'} — {devis.project.end_date || '—'}
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
          {(devis.line_items || []).map((item: LineItem, i: number) => (
            <React.Fragment key={i}>
              <View style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatMoney(item.unit_price, devis.currency)}
              </Text>
              <Text style={styles.colTotal}>
                {formatMoney(item.total, devis.currency)}
              </Text>
            </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total:</Text>
            <Text style={styles.totalValue}>
              {formatMoney(devis.subtotal, devis.currency)}
            </Text>
          </View>
          {devis.tax_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                TVA ({devis.tax_rate}%):
              </Text>
              <Text style={styles.totalValue}>
                {formatMoney(devis.tax_amount, devis.currency)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatMoney(devis.total, devis.currency)}
            </Text>
          </View>
        </View>

        <PdfPaymentMethods isDevis />

        {devis.valid_until && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.subtitle}>
              Valable jusqu'au {devis.valid_until}
            </Text>
          </View>
        )}

        {devis.notes && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text>{devis.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          SCOOP — Devis {devis.reference} — Document confidentiel — (+225) 07 02 90 79 49 — contact@scoop-afrique.com
        </Text>
      </Page>
    </Document>
  )
}
