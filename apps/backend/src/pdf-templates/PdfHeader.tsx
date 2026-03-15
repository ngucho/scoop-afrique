import React from 'react'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = path.join(__dirname, '../../assets/logo.png')

const BRAND = '#B91C1C'

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 20,
  },
  logo: {
    width: 48,
    height: 42,
    objectFit: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: BRAND,
  },
  subtitle: {
    fontSize: 9,
    color: '#555',
  },
})

interface PdfHeaderProps {
  docTitle?: string
  showLogo?: boolean
}

export function PdfHeader({ docTitle, showLogo = true }: PdfHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>SCOOP</Text>
        <Text style={styles.subtitle}>SARL au capital de 1 000 000 FCFA</Text>
        <Text style={styles.subtitle}>Siège : Abidjan Cocody Riviera Faya — 01 BP 130 Abidjan 01</Text>
        {docTitle && <Text style={styles.subtitle}>{docTitle}</Text>}
      </View>
      {showLogo && (
        <View style={styles.headerRight}>
          <Image src={LOGO_PATH} style={styles.logo} />
        </View>
      )}
    </View>
  )
}
