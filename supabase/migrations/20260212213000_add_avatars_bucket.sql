-- Add avatars bucket and policies
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 1024000, '{image/jpeg,image/png,image/gif,image/webp,image/svg+xml}')
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects in avatars bucket
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (split_part(name, '/', 1)) = auth.uid()::text);
