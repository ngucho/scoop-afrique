-- Add sidebar placement for reader announcements (home left rail: jobs, celebrations, etc.)
-- Idempotent: skip if label already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'announcement_placement'
      AND e.enumlabel = 'sidebar'
  ) THEN
    ALTER TYPE announcement_placement ADD VALUE 'sidebar';
  END IF;
END $$;
