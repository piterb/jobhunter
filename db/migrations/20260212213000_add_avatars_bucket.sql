-- migrate:up
-- Add avatars bucket and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('jobhunter_avatars', 'jobhunter_avatars', true, 1024000, '{image/jpeg,image/png,image/gif,image/webp,image/svg+xml}')
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects in avatars bucket
CREATE POLICY "jobhunter: Avatars are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'jobhunter_avatars');

CREATE POLICY "jobhunter: Users can upload their own avatar" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'jobhunter_avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "jobhunter: Users can update their own avatar" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'jobhunter_avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "jobhunter: Users can delete their own avatar" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'jobhunter_avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);

-- migrate:down
DROP POLICY IF EXISTS "jobhunter: Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "jobhunter: Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "jobhunter: Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "jobhunter: Users can delete their own avatar" ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'jobhunter_avatars';
