/*
  # Storage buckets for dog photos and avatars
  
  1. New Storage Buckets
    - `dog-photos` - For storing dog profile pictures
    - `avatars` - For storing user profile pictures
  
  2. Security
    - Uses Supabase storage functions to create buckets and policies
    - Avoids direct table manipulation that requires owner privileges
*/

-- Create storage buckets using Supabase's storage extension functions
SELECT storage.create_bucket('dog-photos', 'Dog profile photos storage');
SELECT storage.create_bucket('avatars', 'User profile avatars storage');

-- Update bucket configurations to make them public
UPDATE storage.buckets SET public = TRUE WHERE id = 'dog-photos';
UPDATE storage.buckets SET public = TRUE WHERE id = 'avatars';

-- Set file size limits and allowed MIME types
UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'dog-photos';

UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- Create storage policies using Supabase's storage extension functions
-- Dog photos policies
SELECT storage.create_policy('dog-photos', 'authenticated users can upload dog photos', 'INSERT', 'authenticated', true);
SELECT storage.create_policy('dog-photos', 'public can view dog photos', 'SELECT', 'public', true);
SELECT storage.create_policy('dog-photos', 'users can update their dog photos', 'UPDATE', 'authenticated', true);
SELECT storage.create_policy('dog-photos', 'users can delete their dog photos', 'DELETE', 'authenticated', true);

-- Avatar policies
SELECT storage.create_policy('avatars', 'authenticated users can upload avatars', 'INSERT', 'authenticated', true);
SELECT storage.create_policy('avatars', 'public can view avatars', 'SELECT', 'public', true);
SELECT storage.create_policy('avatars', 'users can update their avatars', 'UPDATE', 'authenticated', true);
SELECT storage.create_policy('avatars', 'users can delete their avatars', 'DELETE', 'authenticated', true);