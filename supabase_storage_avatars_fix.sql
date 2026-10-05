-- ============================================================================
-- THE GLITCH ROOM — SUPABASE STORAGE 'avatars' BUCKET PERMISSIONS & RLS FIX
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run
-- ============================================================================

-- 1. Ensure the 'avatars' storage bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    52428800, -- 50 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];

-- 2. Drop any legacy/conflicting RLS policies on storage.objects for avatars
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Policy" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public view of avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes to avatars" ON storage.objects;

-- 3. Policy: Anyone can view/download images from the 'avatars' bucket
CREATE POLICY "Allow public view of avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Policy: Authenticated users can upload (INSERT) avatars & banners
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
);

-- 5. Policy: Authenticated users can update/overwrite their avatars & banners
CREATE POLICY "Allow authenticated updates to avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 6. Policy: Authenticated users can delete their objects from 'avatars'
CREATE POLICY "Allow authenticated deletes to avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
