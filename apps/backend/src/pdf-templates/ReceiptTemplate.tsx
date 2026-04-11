import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'

const BRAND = '#B91C1C'
const MUTED = '#444'

const styles = StyleSheet.create({
  page: {
    padding: 22,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND,
    paddingBottom: 8,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND,
    marginBottom: 2,
  },
  legalLine: {
    fontSize: 6.5,
    color: MUTED,
    marginBottom: 1,
  },
  docTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  amountBox: {
    marginVertical: 10,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 3,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 7,
    marginBottom: 4,
    color: MUTED,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 5,
    color: BRAND,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: { width: 78, color: MUTED, fontSize: 7 },
  value: { flex: 1, fontSize: 7.5, color: '#1a1a1a' },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    fontSize: 6,
    color: MUTED,
    textAlign: 'center',
  },
})

export interface ReceiptIssuer {
  legalName: string
  legalForm: string
  rccm: string
  ncc?: string | null
  address: string
  phone: string
  email: string
}

interface ReceiptData {
  issuer: ReceiptIssuer
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
  const { issuer, payment, invoice, contact } = receipt
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''
  const methodLabel = methodLabels[payment.method] || payment.method
  const receiptRef = payment.id.slice(0, 8).toUpperCase()

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.brandRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.brandTitle}>{issuer.legalName}</Text>
            <Text style={styles.legalLine}>{issuer.legalForm}</Text>
            <Text style={styles.legalLine}>RCCM : {issuer.rccm}</Text>
            {issuer.ncc ? <Text style={styles.legalLine}>NCC : {issuer.ncc}</Text> : null}
            <Text style={styles.legalLine}>{issuer.address}</Text>
            <Text style={styles.legalLine}>
              Tél. {issuer.phone} · {issuer.email}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>REÇU DE PAIEMENT</Text>
            <Text style={{ ...styles.legalLine, textAlign: 'right', marginTop: 4 }}>N° {receiptRef}</Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Montant reçu</Text>
          <Text style={styles.amountValue}>{formatMoney(payment.amount, payment.currency)}</Text>
        </View>

        <View style={{ marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Détail</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date :</Text>
            <Text style={styles.value}>{new Date(payment.paid_at).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Moyen :</Text>
            <Text style={styles.value}>{methodLabel}</Text>
          </View>
          {payment.reference ? (
            <View style={styles.row}>
              <Text style={styles.label}>Réf. paiement :</Text>
              <Text style={styles.value}>{payment.reference}</Text>
            </View>
          ) : null}
          {invoice?.reference ? (
            <View style={styles.row}>
              <Text style={styles.label}>Facture :</Text>
              <Text style={styles.value}>{invoice.reference}</Text>
            </View>
          ) : null}
        </View>

        {contactName ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nom :</Text>
              <Text style={styles.value}>
                {contactName}
                {contact?.company ? ` — ${contact.company}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footer}>
          Document établi pour servir et valoir ce que de droit — {issuer.legalName} — RCCM {issuer.rccm}
        </Text>
      </Page>
    </Document>
  )
}
