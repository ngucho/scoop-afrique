-- Storage: create bucket "images" in Supabase Dashboard (Storage) first:
--   - Public bucket, 5 MB limit
--   - MIME: image/jpeg, image/png, image/webp, image/gif, image/avif
-- Videos are NOT stored — always YouTube embed URLs on articles.
-- Then run this migration to add policies.

-- Authenticated users can upload (backend enforces journalist+ role)
CREATE POLICY "images_authenticated_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "images_public_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'images');

CREATE POLICY "images_authenticated_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images');
