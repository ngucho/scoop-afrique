-- Reader community contributions (tribune libre + event tips)

CREATE TYPE "public"."contribution_kind" AS ENUM('writing', 'event');

CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'approved', 'rejected');

CREATE TABLE "public"."reader_contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "public"."contribution_kind" DEFAULT 'writing' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"event_location" text,
	"event_starts_at" timestamp with time zone,
	"status" "public"."contribution_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."reader_contributions" ADD CONSTRAINT "reader_contributions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "reader_contributions_status_idx" ON "public"."reader_contributions" USING btree ("status");

CREATE INDEX "reader_contributions_created_idx" ON "public"."reader_contributions" USING btree ("created_at" DESC);
