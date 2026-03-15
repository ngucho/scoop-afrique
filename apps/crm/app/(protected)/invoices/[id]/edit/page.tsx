import { notFound } from 'next/navigation'
import { Heading } from 'scoop'
import { crmGetServer } from '@/lib/api-server'
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder'

export default async function InvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await crmGetServer<Record<string, unknown>>(`invoices/${id}`)
  const invoice = result?.data

  if (!invoice) notFound()

  const lineItems = ((invoice.line_items as Array<Record<string, unknown>>) ?? []).map((i) => ({
    description: i.description as string,
    quantity: (i.quantity as number) ?? 1,
    unit_price: (i.unit_price as number) ?? 0,
    unit: (i.unit as string) ?? 'unité',
    tax_rate: (i.tax_rate as number) ?? 0,
  })) as Array<{ description: string; quantity: number; unit_price: number; unit: string; tax_rate: number }>

  const defaultValues = {
    contact_id: invoice.contact_id as string,
    project_id: invoice.project_id as string,
    line_items: lineItems.length > 0 ? lineItems : [{ description: '', quantity: 1, unit_price: 0, unit: 'unité', tax_rate: 0 }],
    tax_rate: (invoice.tax_rate as number) ?? 0,
    discount_amount: (invoice.discount_amount as number) ?? 0,
    due_date: invoice.due_date ? (invoice.due_date as string).slice(0, 10) : undefined,
    notes: invoice.notes as string,
  }

  const [contactsRes, projectsRes] = await Promise.all([
    crmGetServer<Array<Record<string, unknown>>>('contacts?limit=100'),
    crmGetServer<Array<Record<string, unknown>>>('projects?limit=100'),
  ])
  const contacts = (contactsRes?.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: c.first_name as string,
    last_name: c.last_name as string,
  }))
  const projects = (projectsRes?.data ?? []).map((p) => ({
    id: p.id as string,
    reference: p.reference as string,
    title: p.title as string,
  }))

  return (
    <div className="space-y-6">
      <Heading as="h1" level="h1">
        Modifier la facture {invoice.reference as string}
      </Heading>
      <InvoiceBuilder
        invoiceId={id}
        defaultValues={defaultValues}
        contacts={contacts}
        projects={projects}
      />
    </div>
  )
}
