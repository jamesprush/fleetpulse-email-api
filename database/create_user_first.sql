-- First create the user profile, then channels
-- Run this to create James' user profile

INSERT INTO users (email, username, display_name, role, status) VALUES
  ('james@wheelzup.com', 'james.admin', 'James Prush', 'admin', 'online')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Now create channels
INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'General', 'General driver discussions and announcements', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Management', 'Leadership and management discussions', 'text', true, id
FROM users WHERE email = 'james@wheelzup.com'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Announcements', 'Important company-wide announcements', 'announcement', false, id
FROM users WHERE email = 'james@wheelzup.com'
ON CONFLICT (name) DO NOTHING;

-- Add James to all channels as admin
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, u.id, 'admin'
FROM channels c, users u
WHERE u.email = 'james@wheelzup.com'
ON CONFLICT (channel_id, user_id) DO UPDATE SET role = 'admin';

-- Verify everything exists
SELECT 'User:' as type, email, username, role FROM users WHERE email = 'james@wheelzup.com';
SELECT 'Channels:' as type, name, type as channel_type FROM channels ORDER BY name;
SELECT 'Memberships:' as type, c.name as channel, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id 
WHERE u.email = 'james@wheelzup.com'
ORDER BY c.name;
