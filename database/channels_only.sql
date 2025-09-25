-- Create channels and memberships only (user already exists)
-- Run this if your user already exists in the database

-- Create channels (only if they don't exist)
INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'General', 'General driver discussions and announcements', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Management', 'Leadership and management discussions', 'text', true, id
FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
ON CONFLICT (name) DO NOTHING;

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Announcements', 'Important company-wide announcements', 'announcement', false, id
FROM users WHERE email = 'james@wheelzup.com' OR username = 'james.admin'
ON CONFLICT (name) DO NOTHING;

-- Add James to all channels as admin (only if not already a member)
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, u.id, 'admin'
FROM channels c, users u
WHERE (u.email = 'james@wheelzup.com' OR u.username = 'james.admin')
ON CONFLICT (channel_id, user_id) DO UPDATE SET role = 'admin';

-- Verify everything exists
SELECT 'User exists:' as status, email, username, role FROM users WHERE email = 'james@wheelzup.com';
SELECT 'Channels exist:' as status, name, type FROM channels ORDER BY name;
SELECT 'Memberships exist:' as status, c.name as channel, u.username as user, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id 
WHERE u.email = 'james@wheelzup.com'
ORDER BY c.name;
