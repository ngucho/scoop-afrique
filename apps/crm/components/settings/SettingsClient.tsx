'use client'

import { Card, CardContent, CardHeader } from 'scoop'

export function SettingsClient() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">API & Connexion</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            L&apos;API CRM est configurée via <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL</code>.
          </p>
          <p>
            L&apos;authentification utilise Auth0 avec les permissions <code className="bg-muted px-1 rounded">read:crm</code>, <code className="bg-muted px-1 rounded">write:crm</code>, <code className="bg-muted px-1 rounded">manage:crm</code>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Notifications</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Les notifications (email, WhatsApp) sont gérées par le backend via Resend et Twilio.
          </p>
          <p>
            Les relances peuvent être envoyées manuellement depuis la page Relances ou programmées (scheduled_at).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Documents PDF</h2>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Les devis, factures, contrats et reçus sont générés en PDF côté backend avec @react-pdf/renderer.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
