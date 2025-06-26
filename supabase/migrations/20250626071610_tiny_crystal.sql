/*
  # Update Dog Gender and Add More Breeds

  1. Database Changes
    - Remove 'unknown' from gender constraint
    - Update existing 'unknown' genders to NULL
    - Add comprehensive list of dog breeds

  2. New Features
    - Only male/female gender options
    - Extensive breed database for better selection
*/

-- Update gender constraint to only allow male/female
ALTER TABLE dogs DROP CONSTRAINT IF EXISTS dogs_gender_check;
ALTER TABLE dogs ADD CONSTRAINT dogs_gender_check CHECK (gender IN ('male', 'female'));

-- Update existing 'unknown' genders to NULL
UPDATE dogs SET gender = NULL WHERE gender = 'unknown';

-- Change default from 'unknown' to NULL
ALTER TABLE dogs ALTER COLUMN gender DROP DEFAULT;

-- Create breeds table for better breed management
CREATE TABLE IF NOT EXISTS dog_breeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text,
  size_category text CHECK (size_category IN ('toy', 'small', 'medium', 'large', 'giant')),
  created_at timestamptz DEFAULT now()
);

-- Insert comprehensive list of dog breeds
INSERT INTO dog_breeds (name, category, size_category) VALUES
-- Toy breeds
('Chihuahua', 'Toy', 'toy'),
('Pomeranian', 'Toy', 'toy'),
('Yorkshire Terrier', 'Toy', 'toy'),
('Maltese', 'Toy', 'toy'),
('Papillon', 'Toy', 'toy'),
('Pug', 'Toy', 'small'),
('Shih Tzu', 'Toy', 'small'),
('Cavalier King Charles Spaniel', 'Toy', 'small'),
('Havanese', 'Toy', 'small'),
('Japanese Chin', 'Toy', 'toy'),

-- Small breeds
('French Bulldog', 'Non-Sporting', 'small'),
('Boston Terrier', 'Non-Sporting', 'small'),
('Beagle', 'Hound', 'small'),
('Cocker Spaniel', 'Sporting', 'small'),
('Dachshund', 'Hound', 'small'),
('Jack Russell Terrier', 'Terrier', 'small'),
('West Highland White Terrier', 'Terrier', 'small'),
('Scottish Terrier', 'Terrier', 'small'),
('Corgi (Pembroke Welsh)', 'Herding', 'small'),
('Corgi (Cardigan Welsh)', 'Herding', 'small'),

-- Medium breeds
('Border Collie', 'Herding', 'medium'),
('Australian Shepherd', 'Herding', 'medium'),
('Brittany', 'Sporting', 'medium'),
('English Springer Spaniel', 'Sporting', 'medium'),
('American Staffordshire Terrier', 'Terrier', 'medium'),
('Bull Terrier', 'Terrier', 'medium'),
('Whippet', 'Hound', 'medium'),
('Basenji', 'Hound', 'medium'),
('Siberian Husky', 'Working', 'medium'),
('Australian Cattle Dog', 'Herding', 'medium'),

-- Large breeds
('Labrador Retriever', 'Sporting', 'large'),
('Golden Retriever', 'Sporting', 'large'),
('German Shepherd', 'Herding', 'large'),
('Boxer', 'Working', 'large'),
('Rottweiler', 'Working', 'large'),
('Doberman Pinscher', 'Working', 'large'),
('Standard Poodle', 'Non-Sporting', 'large'),
('Weimaraner', 'Sporting', 'large'),
('Vizsla', 'Sporting', 'large'),
('Rhodesian Ridgeback', 'Hound', 'large'),

-- Giant breeds
('Great Dane', 'Working', 'giant'),
('Saint Bernard', 'Working', 'giant'),
('Mastiff', 'Working', 'giant'),
('Newfoundland', 'Working', 'giant'),
('Irish Wolfhound', 'Hound', 'giant'),
('Great Pyrenees', 'Working', 'giant'),
('Bernese Mountain Dog', 'Working', 'giant'),
('Leonberger', 'Working', 'giant'),
('Anatolian Shepherd', 'Working', 'giant'),
('Tibetan Mastiff', 'Working', 'giant'),

-- Popular mixed breeds and designer dogs
('Labradoodle', 'Mixed', 'medium'),
('Goldendoodle', 'Mixed', 'medium'),
('Cockapoo', 'Mixed', 'small'),
('Schnoodle', 'Mixed', 'small'),
('Yorkipoo', 'Mixed', 'toy'),
('Puggle', 'Mixed', 'small'),
('Bernedoodle', 'Mixed', 'large'),
('Saint Berdoodle', 'Mixed', 'giant'),
('Aussiedoodle', 'Mixed', 'medium'),
('Sheepadoodle', 'Mixed', 'large'),

-- Additional popular breeds
('Akita', 'Working', 'large'),
('Alaskan Malamute', 'Working', 'large'),
('American Bulldog', 'Working', 'large'),
('Basset Hound', 'Hound', 'medium'),
('Bloodhound', 'Hound', 'large'),
('Bichon Frise', 'Non-Sporting', 'small'),
('Chinese Crested', 'Toy', 'toy'),
('Chow Chow', 'Non-Sporting', 'medium'),
('Dalmatian', 'Non-Sporting', 'medium'),
('English Bulldog', 'Non-Sporting', 'medium'),
('Greyhound', 'Hound', 'large'),
('Italian Greyhound', 'Toy', 'toy'),
('Keeshond', 'Non-Sporting', 'medium'),
('Lhasa Apso', 'Non-Sporting', 'small'),
('Miniature Pinscher', 'Toy', 'toy'),
('Norwegian Elkhound', 'Hound', 'medium'),
('Old English Sheepdog', 'Herding', 'large'),
('Pekingese', 'Toy', 'toy'),
('Pointer', 'Sporting', 'large'),
('Portuguese Water Dog', 'Working', 'medium'),
('Samoyed', 'Working', 'medium'),
('Shar Pei', 'Non-Sporting', 'medium'),
('Shiba Inu', 'Non-Sporting', 'small'),
('Soft Coated Wheaten Terrier', 'Terrier', 'medium'),
('Staffordshire Bull Terrier', 'Terrier', 'medium'),
('Wire Fox Terrier', 'Terrier', 'small'),
('Mixed Breed', 'Mixed', 'medium'),
('Unknown Breed', 'Unknown', 'medium')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on dog_breeds table
ALTER TABLE dog_breeds ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to breeds
CREATE POLICY "Public can read dog breeds"
  ON dog_breeds
  FOR SELECT
  TO public
  USING (true);