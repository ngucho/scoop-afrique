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
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
    color: '#1a1a1a',
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

interface ContractData {
  reference: string
  title: string
  type: string
  content: Record<string, unknown> | string
  contact?: {
    first_name?: string
    last_name?: string
    company?: string
  }
  expires_at?: string
  signed_at?: string
}

export function ContractTemplate({ contract }: { contract: ContractData }) {
  const contact = contract.contact
  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : ''

  const renderContent = () => {
    const c = contract.content
    if (typeof c === 'string') {
      return (
        <Text style={styles.paragraph}>{c}</Text>
      )
    }
    if (c && typeof c === 'object' && 'clauses' in c && Array.isArray((c as { clauses: unknown[] }).clauses)) {
      return ((c as { clauses: Array<{ title?: string; text?: string }> }).clauses).map((clause, i) => (
        <React.Fragment key={i}>
          <View style={styles.section}>
          {clause.title && (
            <Text style={styles.sectionTitle}>{clause.title}</Text>
          )}
          <Text style={styles.paragraph}>{clause.text || ''}</Text>
        </View>
        </React.Fragment>
      ))
    }
    if (c && typeof c === 'object' && 'body' in c) {
      return (
        <Text style={styles.paragraph}>{(c as { body: string }).body}</Text>
      )
    }
    return (
      <Text style={styles.paragraph}>
        {JSON.stringify(c)}
      </Text>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader docTitle={`Contrat ${contract.reference}`} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{contract.title}</Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subtitle}>Type: {contract.type}</Text>
            <Text style={styles.subtitle}>Référence: {contract.reference}</Text>
          </View>
        </View>

        {contactName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partie contractante</Text>
            <Text style={styles.paragraph}>
              {contactName}
              {contact?.company ? ` — ${contact.company}` : ''}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contenu</Text>
          {renderContent()}
        </View>

        {contract.expires_at && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.subtitle}>
              Date d'expiration: {contract.expires_at}
            </Text>
          </View>
        )}

        {contract.signed_at && (
          <View style={[styles.section, { marginTop: 15 }]}>
            <Text style={styles.subtitle}>
              Signé le: {new Date(contract.signed_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          SCOOP — Contrat {contract.reference} — Document confidentiel
        </Text>
      </Page>
    </Document>
  )
}
