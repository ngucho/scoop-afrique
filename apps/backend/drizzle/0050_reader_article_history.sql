CREATE TABLE IF NOT EXISTS "reader_article_history" (
  "profile_id" uuid NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "article_id" uuid NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
  "viewed_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "reader_article_history_pk" PRIMARY KEY ("profile_id", "article_id")
);

CREATE INDEX IF NOT EXISTS "reader_article_history_profile_viewed_idx"
  ON "reader_article_history" ("profile_id", "viewed_at");

CREATE INDEX IF NOT EXISTS "reader_article_history_article_viewed_idx"
  ON "reader_article_history" ("article_id", "viewed_at");
