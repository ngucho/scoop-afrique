CREATE TABLE IF NOT EXISTS "contribution_comment_reactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comment_id" uuid NOT NULL REFERENCES "contribution_comments"("id") ON DELETE CASCADE,
  "actor_key" text NOT NULL,
  "emoji" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "contribution_comment_reactions_unique_actor_emoji"
  ON "contribution_comment_reactions" ("comment_id", "actor_key", "emoji");
