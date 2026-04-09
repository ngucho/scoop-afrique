-- Reader platform backoffice: announcements, ads, homepage, newsletter campaigns, audit

CREATE TYPE "public"."announcement_audience" AS ENUM('all', 'subscribers', 'guests');
CREATE TYPE "public"."ad_campaign_status" AS ENUM('draft', 'active', 'paused', 'ended');
CREATE TYPE "public"."ad_event_type" AS ENUM('impression', 'click');
CREATE TYPE "public"."newsletter_campaign_cadence" AS ENUM('daily', 'weekly', 'monthly');
CREATE TYPE "public"."newsletter_campaign_status" AS ENUM('draft', 'scheduled', 'sent', 'cancelled');
CREATE TYPE "public"."homepage_section_layout" AS ENUM('featured_grid', 'list', 'carousel');

CREATE TABLE "public"."reader_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" "announcement_audience" DEFAULT 'all' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."ad_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL UNIQUE,
	"label" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."ad_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL REFERENCES "public"."ad_slots"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"status" "ad_campaign_status" DEFAULT 'draft' NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"weight" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."ad_creatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL REFERENCES "public"."ad_campaigns"("id") ON DELETE CASCADE,
	"headline" text NOT NULL,
	"body" text,
	"image_url" text,
	"link_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."ad_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_key" text NOT NULL,
	"campaign_id" uuid REFERENCES "public"."ad_campaigns"("id") ON DELETE SET NULL,
	"creative_id" uuid REFERENCES "public"."ad_creatives"("id") ON DELETE SET NULL,
	"event_type" "ad_event_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."homepage_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL UNIQUE,
	"title" text NOT NULL,
	"layout" "homepage_section_layout" DEFAULT 'list' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."newsletter_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cadence" "newsletter_campaign_cadence" NOT NULL,
	"segment_filter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"subject_template" text NOT NULL,
	"status" "newsletter_campaign_status" DEFAULT 'draft' NOT NULL,
	"send_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "public"."admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "ad_events_campaign_created_idx" ON "public"."ad_events" ("campaign_id", "created_at");
CREATE INDEX "ad_events_type_created_idx" ON "public"."ad_events" ("event_type", "created_at");
CREATE INDEX "admin_audit_entity_idx" ON "public"."admin_audit_log" ("entity_type", "created_at");

INSERT INTO "public"."ad_slots" ("key", "label", "description") VALUES
  ('homepage_hero', 'Accueil — bandeau', 'Emplacement principal sous le header'),
  ('article_inline', 'Article — in-texte', 'Bloc entre paragraphes'),
  ('sidebar', 'Sidebar', 'Colonne latérale reader')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "public"."homepage_sections" ("key", "title", "layout", "sort_order", "config", "is_visible") VALUES
  ('top_stories', 'À la une', 'featured_grid', 0, '{"max_items": 6}'::jsonb, true),
  ('latest', 'Derniers articles', 'list', 1, '{"max_items": 10}'::jsonb, true),
  ('video', 'Vidéos', 'carousel', 2, '{"tag": "video"}'::jsonb, true)
ON CONFLICT ("key") DO NOTHING;

ALTER TABLE "public"."newsletter_subscribers" ADD COLUMN IF NOT EXISTS "segment_tags" text[] DEFAULT '{}' NOT NULL;
ALTER TABLE "public"."newsletter_subscribers" ADD COLUMN IF NOT EXISTS "signup_source" text;
