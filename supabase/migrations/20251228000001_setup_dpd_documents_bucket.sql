-- Create storage bucket for DPD administrative documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dpd-documents',
  'dpd-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']::text[];

-- Drop existing storage policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "DPD can upload administrative documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view DPD administrative documents" ON storage.objects;
  DROP POLICY IF EXISTS "DPD can update their own administrative documents" ON storage.objects;
  DROP POLICY IF EXISTS "DPD can delete their own administrative documents" ON storage.objects;
END $$;

-- RLS Policies for dpd-documents bucket
CREATE POLICY "DPD can upload administrative documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'dpd-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view DPD administrative documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'dpd-documents' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('okk', 'sekjend', 'ketum')
      )
    )
  );

CREATE POLICY "DPD can update their own administrative documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'dpd-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "DPD can delete their own administrative documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'dpd-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
