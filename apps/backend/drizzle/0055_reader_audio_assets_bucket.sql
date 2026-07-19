INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reader-audio-assets',
  'reader-audio-assets',
  true,
  10485760,
  ARRAY['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
