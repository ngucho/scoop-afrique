-- Tribune: anonymous posts, follows, comment anonymity

ALTER TABLE reader_contributions
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

ALTER TABLE contribution_comments
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS tribune_follows (
  follower_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_profile_id, following_profile_id),
  CONSTRAINT tribune_follows_no_self CHECK (follower_profile_id <> following_profile_id)
);

CREATE INDEX IF NOT EXISTS tribune_follows_following_idx ON tribune_follows (following_profile_id);
CREATE INDEX IF NOT EXISTS tribune_follows_follower_idx ON tribune_follows (follower_profile_id);
