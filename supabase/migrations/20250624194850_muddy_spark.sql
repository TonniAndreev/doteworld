/*
  # Disable Email Confirmation

  1. Configuration
    - Disable email confirmation requirement
    - Allow users to sign in immediately after registration
*/

-- This migration disables email confirmation
-- Note: This should be configured in your Supabase dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF
-- Set "Enable phone confirmations" to OFF

-- For now, we'll create a note in the database
CREATE TABLE IF NOT EXISTS auth_config_notes (
  id SERIAL PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO auth_config_notes (note) VALUES 
('Email confirmation disabled - configure in Supabase dashboard: Authentication > Settings > Enable email confirmations = OFF');