-- Reader subscribers (Auth0 reader app) + digest email tracking
CREATE TYPE digest_frequency AS ENUM ('daily', 'weekly', 'monthly', 'off');

CREATE TABLE reader_subscribers (
  auth0_sub TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  topic_category_ids UUID[] NOT NULL DEFAULT '{}',
  digest_frequency digest_frequency NOT NULL DEFAULT 'weekly',
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  next_digest_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reader_subscribers_next_digest_idx
  ON reader_subscribers (next_digest_at)
  WHERE unsubscribed_at IS NULL AND digest_frequency != 'off';

CREATE TYPE email_delivery_status AS ENUM (
  'queued',
  'sent',
  'delivered',
  'bounced',
  'failed',
  'complained'
);

CREATE TABLE email_outbound (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  to_email TEXT NOT NULL,
  resend_message_id TEXT,
  status email_delivery_status NOT NULL DEFAULT 'queued',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX email_outbound_resend_message_id_idx ON email_outbound (resend_message_id);

CREATE TABLE digest_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency digest_frequency NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  article_ids UUID[] NOT NULL DEFAULT '{}',
  recipients_attempted INT NOT NULL DEFAULT 0,
  recipients_sent INT NOT NULL DEFAULT 0,
  recipients_failed INT NOT NULL DEFAULT 0,
  error TEXT
);
