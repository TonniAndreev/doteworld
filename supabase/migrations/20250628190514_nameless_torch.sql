/*
  # Storage Buckets and Policies Setup

  1. New Buckets
    - `dog_photos`: For storing dog profile images
    - `avatars`: For storing user profile avatars
  
  2. Bucket Configuration
    - Both buckets are public (readable by anyone)
    - 5MB file size limit
    - Allowed MIME types: JPEG, PNG, WebP, GIF
  
  3. Security Policies
    - Authenticated users can upload files
    - Public can view files
    - Authenticated users can update/delete their own files
*/

-- Create storage buckets using Supabase's storage extension functions
SELECT storage.create_bucket('dog_photos', 'Dog profile photos storage');
SELECT storage.create_bucket('avatars', 'User profile avatars storage');

-- Update bucket configurations to make them public
UPDATE storage.buckets SET public = TRUE WHERE id = 'dog_photos';
UPDATE storage.buckets SET public = TRUE WHERE id = 'avatars';

-- Set file size limits and allowed MIME types
UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'dog_photos';

UPDATE storage.buckets 
SET file_size_limit = 5242880, -- 5MB
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- Create storage policies using Supabase's storage extension functions
-- Dog photos policies
SELECT storage.create_policy('dog_photos', 'authenticated users can upload dog photos', 'INSERT', 'authenticated', true);
SELECT storage.create_policy('dog_photos', 'public can view dog photos', 'SELECT', 'public', true);
SELECT storage.create_policy('dog_photos', 'users can update their dog photos', 'UPDATE', 'authenticated', true);
SELECT storage.create_policy('dog_photos', 'users can delete their dog photos', 'DELETE', 'authenticated', true);

-- Avatar policies
SELECT storage.create_policy('avatars', 'authenticated users can upload avatars', 'INSERT', 'authenticated', true);
SELECT storage.create_policy('avatars', 'public can view avatars', 'SELECT', 'public', true);
SELECT storage.create_policy('avatars', 'users can update their avatars', 'UPDATE', 'authenticated', true);
SELECT storage.create_policy('avatars', 'users can delete their avatars', 'DELETE', 'authenticated', true);