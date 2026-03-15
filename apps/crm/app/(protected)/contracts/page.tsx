import Link from 'next/link'
import { Heading, Button } from 'scoop'
import { crmGetServer } from '@/lib/api-server'

export default async function ContractsPage() {
  const result = await crmGetServer<Array<Record<string, unknown>>>('contracts?limit=50')
  const contracts = result?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading as="h1" level="h1">
          Contrats
        </Heading>
        <Link href="/contracts/new">
          <Button>Nouveau contrat</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Référence</th>
              <th className="text-left p-3 font-medium">Titre</th>
              <th className="text-left p-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id as string} className="border-t border-border hover:bg-muted/30">
                <td className="p-3">
                  <Link href={`/contracts/${c.id}`} className="font-medium hover:underline">
                    {String(c.reference ?? '—')}
                  </Link>
                </td>
                <td className="p-3">{String(c.title ?? '—')}</td>
                <td className="p-3">
                  <span className="capitalize">{String(c.status ?? '—')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          Aucun contrat.
        </p>
      )}
    </div>
  )
}
