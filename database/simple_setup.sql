-- Simple FleetPulse Connect Setup
-- Run this AFTER creating your user in Supabase Authentication

-- Insert user profile for the authenticated user
-- Replace 'james@wheelzup.com' with your actual email
INSERT INTO users (email, username, display_name, role, status) VALUES
  ('james@wheelzup.com', 'james.admin', 'James Prush', 'admin', 'online')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Get the user ID for James
-- This will be used to create channels and memberships
WITH james_user AS (
  SELECT id FROM users WHERE email = 'james@wheelzup.com'
)
INSERT INTO channels (name, description, type, is_private, created_by) VALUES
  ('General', 'General driver discussions and announcements', 'text', false, (SELECT id FROM james_user)),
  ('Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, (SELECT id FROM james_user)),
  ('Management', 'Leadership and management discussions', 'text', true, (SELECT id FROM james_user)),
  ('Announcements', 'Important company-wide announcements', 'announcement', false, (SELECT id FROM james_user))
ON CONFLICT (name) DO NOTHING;

-- Add James to all channels as admin
WITH james_user AS (
  SELECT id FROM users WHERE email = 'james@wheelzup.com'
)
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, j.id, 'admin'
FROM channels c, james_user j
ON CONFLICT (channel_id, user_id) DO UPDATE SET role = 'admin';

-- Optional: Add a second user for testing
-- Uncomment and modify this if you want to add Wes as well
/*
INSERT INTO users (email, username, display_name, role, status) VALUES
  ('wes@wheelzup.com', 'wes.driver', 'Wes Johnson', 'driver', 'online')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Add Wes to public channels as member
WITH wes_user AS (
  SELECT id FROM users WHERE email = 'wes@wheelzup.com'
)
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, w.id, 'member'
FROM channels c, wes_user w
WHERE c.is_private = false
ON CONFLICT (channel_id, user_id) DO NOTHING;
*/
