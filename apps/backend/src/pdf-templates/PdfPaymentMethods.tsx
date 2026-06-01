import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'

const BRAND = '#B91C1C'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'

export interface PdfPaymentMethod {
  id: string
  label: string
  number?: string
  iban?: string
  instructions?: string
  active: boolean
  sort: number
}

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  title: {
    fontSize: 8,
    fontWeight: 'bold',
    color: BRAND,
    marginBottom: 5,
  },
  modalities: {
    fontSize: 7.5,
    color: MUTED,
    marginBottom: 7,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND,
    paddingBottom: 3,
    marginBottom: 2,
  },
  headerText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: BRAND,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  colMethod: { width: 95 },
  colDetails: { flex: 1 },
  methodText: { fontSize: 8.5, fontWeight: 'bold', color: '#1F2937' },
  detailsText: { fontSize: 8, color: MUTED },
  footer: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 6,
    fontStyle: 'italic',
  },
})

export function PdfPaymentMethods({
  methods,
  isDevis = true,
}: {
  methods: PdfPaymentMethod[]
  isDevis?: boolean
}) {
  const activeMethods = methods.filter((m) => m.active)
  if (activeMethods.length === 0) return null

  return (
    <View style={styles.section}>
      <Text style={styles.title}>CONDITIONS DE PAIEMENT</Text>
      <Text style={styles.modalities}>
        Paiement à réception {isDevis ? 'du devis signé' : 'de la facture'} — Mobile Money ou Virement bancaire
      </Text>
      <View style={styles.headerRow}>
        <View style={styles.colMethod}>
          <Text style={styles.headerText}>Moyen de paiement</Text>
        </View>
        <View style={styles.colDetails}>
          <Text style={styles.headerText}>Coordonnées / Instructions</Text>
        </View>
      </View>
      {activeMethods.map((m, i) => {
        const coords = [m.iban, m.number].filter(Boolean).join(' / ')
        const detail = [coords, m.instructions].filter(Boolean).join(' — ')
        return (
          <View key={i} style={styles.row}>
            <View style={styles.colMethod}>
              <Text style={styles.methodText}>{m.label}</Text>
            </View>
            <View style={styles.colDetails}>
              <Text style={styles.detailsText}>{detail || '—'}</Text>
            </View>
          </View>
        )
      })}
      {isDevis && (
        <Text style={styles.footer}>
          Délai de paiement : 5 jours à compter de la date d'émission{'\n'}
          Début de prestation : à réception du paiement intégral
        </Text>
      )}
    </View>
  )
}
