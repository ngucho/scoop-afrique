DO $$
BEGIN
  CREATE TYPE "article_audio_job_status" AS ENUM ('queued', 'processing', 'done', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "audio_url" text,
  ADD COLUMN IF NOT EXISTS "audio_storage_path" text,
  ADD COLUMN IF NOT EXISTS "audio_duration_sec" integer,
  ADD COLUMN IF NOT EXISTS "audio_generated_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "audio_voice" text,
  ADD COLUMN IF NOT EXISTS "audio_text_hash" text;

CREATE TABLE IF NOT EXISTS "article_audio_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "status" "article_audio_job_status" NOT NULL DEFAULT 'queued',
  "reason" text NOT NULL DEFAULT 'published',
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "locked_at" timestamp with time zone,
  "started_at" timestamp with time zone,
  "finished_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "article_audio_jobs_article_unique_idx"
  ON "article_audio_jobs" ("article_id");

CREATE INDEX IF NOT EXISTS "article_audio_jobs_status_created_idx"
  ON "article_audio_jobs" ("status", "created_at");
