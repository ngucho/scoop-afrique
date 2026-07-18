ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "audio_last_accessed_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "audio_expires_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "articles_audio_expires_idx"
  ON "articles" ("audio_expires_at")
  WHERE "audio_storage_path" IS NOT NULL;
