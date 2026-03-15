# Configuration Twilio — WhatsApp et SMS

Ce guide explique comment configurer Twilio pour recevoir des notifications (WhatsApp, SMS) et envoyer des devis/factures aux clients.

## 1. Créer un compte Twilio

1. Allez sur [twilio.com](https://www.twilio.com) et créez un compte.
2. Vérifiez votre numéro de téléphone et email.
3. Avec un compte **trial** (gratuit), vous avez des crédits pour tester.

## 2. Récupérer les identifiants

### Account SID et Auth Token

1. Connectez-vous au [Console Twilio](https://console.twilio.com).
2. Sur le tableau de bord, notez :
   - **Account SID** (commence par `AC`)
   - **Auth Token** (cliquez sur "Show" pour l'afficher)

### WhatsApp Sandbox (compte trial)

1. Dans le menu : **Messaging** → **Try it out** → **Send a WhatsApp message**.
2. Rejoignez le sandbox en envoyant le code affiché au numéro indiqué (ex. `+1 415 523 8886`).
3. Une fois joint, votre numéro **From** pour WhatsApp est : `whatsapp:+14155238886` (ou celui affiché).

### Numéro pour SMS (compte trial)

- Le même numéro du sandbox WhatsApp peut envoyer des SMS.
- Format : `+14155238886` (sans le préfixe `whatsapp:`).
- Pour les SMS, utilisez ce numéro comme **From**.

## 3. Variables d'environnement

Ajoutez ces variables dans `apps/backend/.env` :

```bash
# Twilio — obligatoires pour WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=+2250700000000

# SMS (optionnel) — numéro pour recevoir les alertes devis
TWILIO_SMS_TO=+2250700000000
```

### Où trouver chaque valeur

| Variable | Où la trouver |
|---------|----------------|
| `TWILIO_ACCOUNT_SID` | Console Twilio → Dashboard (Account SID) |
| `TWILIO_AUTH_TOKEN` | Console Twilio → Dashboard → Auth Token (Show) |
| `TWILIO_WHATSAPP_FROM` | Messaging → Try it out → Send WhatsApp → numéro du sandbox, format `whatsapp:+14155238886` |
| `TWILIO_WHATSAPP_TO` | Votre numéro WhatsApp (ex. +225 07 02 90 79 49 → `+2250702907949`) |
| `TWILIO_SMS_TO` | Même que WHATSAPP_TO ou un autre numéro pour les SMS |

## 4. Flux de notifications

### Demande de devis (brands app)

Quand un client soumet une demande de devis :

- **Email** → Vous (via Resend, à `NOTIFICATION_EMAIL`)
- **WhatsApp** → Vous (à `TWILIO_WHATSAPP_TO`)
- **SMS** → Vous (à `TWILIO_SMS_TO`, si défini)

### Envoi de devis (CRM)

Quand vous cliquez sur "Envoyer le devis" :

- **Email au client** → Devis en pièce jointe (PDF)
- **WhatsApp au client** → Message avec lien de téléchargement du PDF
- **Email à vous** → Copie du devis
- **WhatsApp à vous** → Notification d’envoi

### Envoi de facture (CRM)

Quand vous cliquez sur "Envoyer la facture" :

- **Email au client** → Facture en pièce jointe (PDF)
- **WhatsApp au client** → Message avec lien de téléchargement du PDF
- **Email à vous** → Copie de la facture
- **WhatsApp à vous** → Notification d’envoi

## 5. Configuration Resend (email)

Pour les emails, configurez Resend :

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@votredomaine.com
NOTIFICATION_EMAIL=contact@scoop-afrique.com,votre@email.com
```

- `RESEND_API_KEY` : [resend.com](https://resend.com) → API Keys → Create
- `RESEND_FROM_EMAIL` : Domaine vérifié sur Resend
- `NOTIFICATION_EMAIL` : Liste d’emails (séparés par des virgules) pour recevoir les alertes

## 6. Production (WhatsApp Business API)

En trial, vous utilisez le sandbox WhatsApp. Pour la production :

1. Demandez l’accès à la [WhatsApp Business API](https://www.twilio.com/docs/whatsapp) via Twilio.
2. Vérifiez votre entreprise.
3. Obtenez un numéro WhatsApp dédié.
4. Mettez à jour `TWILIO_WHATSAPP_FROM` avec ce numéro.

## 7. Dépannage

### "Twilio: 21608" ou erreur d’envoi WhatsApp

- Vérifiez que le destinataire a rejoint le sandbox (en trial).
- Vérifiez le format : `+2250702907949` (sans espaces, avec indicatif pays).

### SMS non reçus

- En trial, Twilio peut exiger que vous vérifiiez les numéros de destination.
- Console Twilio → Phone Numbers → Verified Caller IDs.

### PDF non accessible par WhatsApp

- Les PDF sont uploadés sur Supabase Storage.
- Vérifiez que le bucket `crm-documents` existe et est configuré pour l’accès public (ou URLs signées).
