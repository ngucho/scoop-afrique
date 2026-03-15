/**
 * Line items calculation for devis and invoices
 */
export interface LineItemInput {
  description: string
  quantity: number
  unit_price: number
  unit?: string
  tax_rate?: number
}

export interface LineItemComputed extends LineItemInput {
  id?: string
  total: number
}

export function computeLineItems(
  items: LineItemInput[],
  globalTaxRate = 0
): { lineItems: LineItemComputed[]; subtotal: number; taxAmount: number; total: number } {
  const lineItems: LineItemComputed[] = items.map((item) => {
    const lineTotal = Math.round(item.quantity * item.unit_price)
    const taxRate = item.tax_rate ?? globalTaxRate
    const total = taxRate > 0 ? Math.round(lineTotal * (1 + taxRate / 100)) : lineTotal
    return {
      ...item,
      total,
    }
  })

  const subtotal = lineItems.reduce((sum, i) => sum + Math.round(i.quantity * i.unit_price), 0)
  const total = lineItems.reduce((sum, i) => sum + i.total, 0)
  const taxAmount = total - subtotal

  return {
    lineItems: lineItems.map((i) => ({ ...i, total: i.total })),
    subtotal,
    taxAmount,
    total,
  }
}
