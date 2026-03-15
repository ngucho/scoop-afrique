import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'

const BRAND = '#B91C1C'
const MUTED = '#555'

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: BRAND,
  },
  modalities: {
    fontSize: 9,
    color: '#333',
    marginBottom: 8,
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND,
    paddingBottom: 4,
    marginBottom: 4,
    fontSize: 9,
    fontWeight: 'bold',
    color: BRAND,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#d1d5db',
    fontSize: 9,
  },
  colMethod: { flex: 1 },
  colDetails: { flex: 2 },
  footer: {
    fontSize: 8,
    color: MUTED,
    marginTop: 8,
  },
})

const PAYMENT_METHODS = [
  { method: 'Djamo', details: 'https://pay.djamo.com/2a7pq' },
  { method: 'Wave', details: '(+225) 07 02 90 79 49' },
  { method: 'Moov Money', details: '(+225) 0140 92 81 43' },
  { method: 'Orange Money', details: '(+225) 07 77 74 84 32' },
]

export function PdfPaymentMethods({ isDevis = true }: { isDevis?: boolean }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CONDITIONS DE PAIEMENT</Text>
      <Text style={styles.modalities}>
        Modalités :{'\n'}
        • Paiement à réception {isDevis ? 'du devis signé' : 'de la facture'}{'\n'}
        • Virement bancaire ou Mobile Money
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colMethod}>Moyen de paiement</Text>
          <Text style={styles.colDetails}>N° compte ou lien</Text>
        </View>
        {PAYMENT_METHODS.map((p, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colMethod}>{p.method}</Text>
            <Text style={styles.colDetails}>{p.details}</Text>
          </View>
        ))}
      </View>
      {isDevis && (
        <Text style={styles.footer}>
          Délai de paiement : 5 jours à compter de la date d'émission du devis{'\n'}
          Début de la prestation : Sous réserve de réception du paiement intégral
        </Text>
      )}
    </View>
  )
}
