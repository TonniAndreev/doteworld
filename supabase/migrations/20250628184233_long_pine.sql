/*
  # Create Storage Buckets and Policies

  1. Storage Setup
    - Create required storage buckets for the application
    - Set up appropriate RLS policies for secure access
    - Enable public access for avatar and dog photos

  2. Buckets
    - avatars: For user profile photos
    - dog-photos: For dog profile photos

  Note: This migration is for documentation purposes only.
  Storage buckets must be created manually in the Supabase dashboard.
*/

-- This is a documentation-only migration to remind you to create the necessary storage buckets
-- in your Supabase project. Please follow these steps in the Supabase dashboard:

-- 1. Go to Storage in the Supabase dashboard
-- 2. Create a bucket named 'avatars'
--    - Set it to public (allows anyone to read files)
--    - Enable RLS (Row Level Security)
-- 3. Create a bucket named 'dog-photos'
--    - Set it to public (allows anyone to read files)
--    - Enable RLS (Row Level Security)

-- 4. For each bucket, create the following policies:
--    a. For 'avatars' bucket:
--       - Policy name: "Allow users to upload their own avatars"
--       - Operation: INSERT
--       - Using expression: (auth.uid() = storage.foldername(name))
--       - This allows users to upload files only to folders matching their user ID

--    b. For 'dog-photos' bucket:
--       - Policy name: "Allow users to upload dog photos"
--       - Operation: INSERT
--       - Using expression: (auth.uid() = storage.foldername(name))
--       - This allows users to upload files only to folders matching their user ID

--    c. For both buckets:
--       - Policy name: "Allow public read access"
--       - Operation: SELECT
--       - Using expression: true
--       - This allows anyone to read files from the bucket

-- Note: The actual SQL for creating buckets and policies would be executed via
-- the Supabase management API or CLI, not directly in a migration.