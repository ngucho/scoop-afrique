-- Migration 0046: CRM Settings (key-value) + Reminder Rules
-- Enables configurable payment methods (Wave, Orange Money, etc.)
-- and automatic reminder rule engine.

-- CRM Settings: flexible key-value store for team-configurable parameters
CREATE TABLE IF NOT EXISTS crm_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed default payment methods and company info
INSERT INTO crm_settings (key, value) VALUES
  ('payment_methods', '[
    {"id":"wave","label":"Wave","number":"+225 0769966800","instructions":"Envoyez sur ce numéro Wave et partagez la capture","active":true,"sort":1},
    {"id":"orange_money","label":"Orange Money","number":"+225 0769966800","instructions":"Envoyez sur ce numéro Orange Money et partagez la capture","active":true,"sort":2},
    {"id":"mtn_money","label":"MTN MoMo","number":"","instructions":"","active":false,"sort":3},
    {"id":"virement","label":"Virement bancaire","iban":"","instructions":"Virement SGBCI — RIB disponible sur demande","active":false,"sort":4},
    {"id":"cash","label":"Espèces","instructions":"Paiement en agence","active":false,"sort":5}
  ]'::jsonb),
  ('company_info', '{
    "name":"Scoop Afrique",
    "address":"Abidjan, Cocody Riviera Faya, Côte d''Ivoire",
    "email":"Contact@scoop-afrique.com",
    "phone":"+225 0769966800",
    "website":"https://www.scoop-afrique.com",
    "siret":"",
    "rccm":""
  }'::jsonb),
  ('reminder_preferences', '{
    "default_channel":"whatsapp",
    "include_payment_methods_in_reminders":true,
    "auto_send_enabled":false,
    "send_hour":9
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Automatic reminder rules engine
CREATE TABLE IF NOT EXISTS crm_reminder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_event text NOT NULL,
  delay_days integer NOT NULL DEFAULT 3,
  channel text NOT NULL DEFAULT 'whatsapp',
  message_template text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed default reminder rules
INSERT INTO crm_reminder_rules (name, trigger_event, delay_days, channel, message_template, sort_order) VALUES
  ('Suivi devis J+3', 'devis_sent', 3, 'whatsapp',
   'Bonjour {{prenom}}, nous revenons vers vous concernant notre proposition {{reference}} ({{montant}}). Avez-vous eu l''occasion de la consulter ? Nous restons disponibles pour en discuter. — Scoop Afrique',
   1),
  ('Suivi devis J+7', 'devis_sent', 7, 'whatsapp',
   'Bonjour {{prenom}}, sans retour de votre part sur notre devis {{reference}} ({{montant}}), nous souhaitons savoir si vous avez des questions. N''hésitez pas à nous répondre ici. — Scoop Afrique',
   2),
  ('Rappel avant échéance J-7', 'invoice_due_soon', -7, 'whatsapp',
   'Bonjour {{prenom}}, un rappel amical : la facture {{reference}} ({{montant}}) est à régler dans 7 jours. Consultez votre email pour les détails. — Scoop Afrique',
   3),
  ('Relance facture J+1', 'invoice_overdue', 1, 'whatsapp',
   'Bonjour {{prenom}}, sauf erreur de notre part, la facture {{reference}} ({{montant}}) n''a pas encore été réglée. Pouvez-vous nous confirmer la date de paiement prévue ? Merci.',
   4),
  ('Relance facture J+7', 'invoice_overdue', 7, 'whatsapp',
   'Bonjour {{prenom}}, nous n''avons pas encore reçu votre règlement pour la facture {{reference}} ({{montant}}). Merci de procéder au paiement rapidement. Contactez-nous si vous rencontrez une difficulté.',
   5),
  ('Relance urgente J+14', 'invoice_overdue', 14, 'both',
   'Bonjour {{prenom}}, ceci est un rappel urgent : la facture {{reference}} ({{montant}}) est en retard de paiement depuis plus de 2 semaines. Merci de régulariser la situation dans les meilleurs délais. — Équipe Scoop Afrique',
   6)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE crm_settings IS 'CRM configurable settings (payment methods, company info, preferences)';
COMMENT ON TABLE crm_reminder_rules IS 'Automatic reminder rules triggered by events (devis_sent, invoice_overdue, etc.)';
