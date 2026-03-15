import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { PdfHeader } from './PdfHeader.js'

const BRAND = '#B91C1C'
const MUTED = '#555'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
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
  label: { width: 120, color: MUTED },
  value: { flex: 1, color: '#1a1a1a' },
  amountBox: {
    marginTop: 30,
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 4,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    marginBottom: 8,
    color: MUTED,
  },
  amountValue: {
    fontSize: 24,
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

interface ReceiptData {
  payment: {
    id: string
    amount: number
    currency: string
    method: string
    reference?: string
    paid_at: string
  }
  invoice?: {
    reference: string
  }
  contact?: {
    first_name?: string
    last_name?: string
    company?: string
  }
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`
}

const methodLabels: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement bancaire',
  mobile_money: 'Mobile Money',
  wave: 'Wave',
  orange_money: 'Orange Money',
  check: 'Chèque',
  other: 'Autre',
}

export function ReceiptTemplate({ receipt }: { receipt: ReceiptData }) {
  const { payment, invoice, contact } = receipt
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''
  const methodLabel = methodLabels[payment.method] || payment.method

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader docTitle="Reçu de paiement" />

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Montant reçu</Text>
          <Text style={styles.amountValue}>
            {formatMoney(payment.amount, payment.currency)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du paiement</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {new Date(payment.paid_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Moyen:</Text>
            <Text style={styles.value}>{methodLabel}</Text>
          </View>
          {payment.reference && (
            <View style={styles.row}>
              <Text style={styles.label}>Référence:</Text>
              <Text style={styles.value}>{payment.reference}</Text>
            </View>
          )}
          {invoice?.reference && (
            <View style={styles.row}>
              <Text style={styles.label}>Facture:</Text>
              <Text style={styles.value}>{invoice.reference}</Text>
            </View>
          )}
        </View>

        {contactName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reçu par</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Client:</Text>
              <Text style={styles.value}>
                {contactName}
                {contact?.company ? ` (${contact.company})` : ''}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          SCOOP — Reçu de paiement — Document officiel
        </Text>
      </Page>
    </Document>
  )
}
