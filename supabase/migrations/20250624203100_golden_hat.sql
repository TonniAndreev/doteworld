-- Migration to document email confirmation settings
-- Note: Email confirmation must be disabled in Supabase dashboard
-- Go to: Authentication > Settings > Email Auth
-- Set "Enable email confirmations" to OFF

-- Create a configuration note
INSERT INTO auth_config_notes (note) VALUES 
('IMPORTANT: Disable email confirmation in Supabase dashboard:
1. Go to Authentication > Settings
2. Under "Email Auth" section
3. Turn OFF "Enable email confirmations"
4. Turn OFF "Enable phone confirmations" (if not needed)
5. Save settings

This allows users to register and login immediately without email verification.');