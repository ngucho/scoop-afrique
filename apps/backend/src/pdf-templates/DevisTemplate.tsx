import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

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
  label: {
    width: 100,
    color: '#666',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 15,
    marginBottom: 15,
  },
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
  totalLabel: {},
  totalValue: {
    fontWeight: 'bold',
  },
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
        <View style={styles.header}>
          <Text style={styles.title}>SCOOP AFRIQUE</Text>
          <Text style={styles.subtitle}>SARL au capital de 1 000 000 FCFA</Text>
          <Text style={styles.subtitle}>Siège : Abidjan Cocody Riviera Faya — 01 BP 130 Abidjan 01</Text>
          <Text style={styles.subtitle}>Devis {devis.reference}</Text>
        </View>

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
          Scoop Afrique — Devis {devis.reference} — Document confidentiel
        </Text>
      </Page>
    </Document>
  )
}
