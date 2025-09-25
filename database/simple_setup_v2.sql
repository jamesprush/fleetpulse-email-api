-- Simple FleetPulse Connect Setup (Handles Existing Users)
-- Run this AFTER creating your user in Supabase Authentication

-- Insert user profile for the authenticated user (handles if user already exists)
-- Replace 'james@wheelzup.com' with your actual email
INSERT INTO users (email, username, display_name, role, status) VALUES
  ('james@wheelzup.com', 'james.admin', 'James Prush', 'admin', 'online')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Also handle username conflict
INSERT INTO users (email, username, display_name, role, status) VALUES
  ('james@wheelzup.com', 'james.admin', 'James Prush', 'admin', 'online')
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Get the user ID for James and create channels
WITH james_user AS (
  SELECT id FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
)
INSERT INTO channels (name, description, type, is_private, created_by) VALUES
  ('General', 'General driver discussions and announcements', 'text', false, (SELECT id FROM james_user)),
  ('Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, (SELECT id FROM james_user)),
  ('Management', 'Leadership and management discussions', 'text', true, (SELECT id FROM james_user)),
  ('Announcements', 'Important company-wide announcements', 'announcement', false, (SELECT id FROM james_user))
ON CONFLICT (name) DO NOTHING;

-- Add James to all channels as admin
WITH james_user AS (
  SELECT id FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
)
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, j.id, 'admin'
FROM channels c, james_user j
ON CONFLICT (channel_id, user_id) DO UPDATE SET role = 'admin';

-- Verify everything was created
SELECT 'User created:' as status, email, username, role FROM users WHERE email = 'james@wheelzup.com';
SELECT 'Channels created:' as status, name, type FROM channels ORDER BY name;
SELECT 'Memberships created:' as status, c.name as channel, u.username as user, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id 
WHERE u.email = 'james@wheelzup.com';
