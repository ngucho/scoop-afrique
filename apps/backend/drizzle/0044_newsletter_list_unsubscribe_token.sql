-- Permanent token for one-click unsubscribe from weekly newsletter (confirmed subscribers).
ALTER TABLE "newsletter_subscribers" ADD COLUMN IF NOT EXISTS "list_unsubscribe_token" text;
UPDATE "newsletter_subscribers" SET "list_unsubscribe_token" = gen_random_uuid()::text WHERE "list_unsubscribe_token" IS NULL;
ALTER TABLE "newsletter_subscribers" ALTER COLUMN "list_unsubscribe_token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_list_unsubscribe_token_unique" ON "newsletter_subscribers" ("list_unsubscribe_token");
