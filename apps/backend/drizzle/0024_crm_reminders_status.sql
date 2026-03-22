-- Reminder workflow status + updated_at
DO $$ BEGIN
  CREATE TYPE crm_reminder_status AS ENUM (
    'draft',
    'scheduled',
    'sent',
    'replied',
    'successful',
    'closed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE crm_reminders
  ADD COLUMN IF NOT EXISTS status crm_reminder_status NOT NULL DEFAULT 'draft';

ALTER TABLE crm_reminders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE crm_reminders
SET status = 'sent', updated_at = now()
WHERE sent_at IS NOT NULL;

UPDATE crm_reminders
SET status = 'scheduled', updated_at = now()
WHERE sent_at IS NULL
  AND scheduled_at IS NOT NULL
  AND status = 'draft';
