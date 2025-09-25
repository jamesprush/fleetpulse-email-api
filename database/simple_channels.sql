-- Create channels and memberships (simple version)
-- Run this to set up your channels

-- Create channels (will fail if they already exist, that's OK)
INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'General', 'General driver discussions and announcements', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com';

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, id
FROM users WHERE email = 'james@wheelzup.com';

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Management', 'Leadership and management discussions', 'text', true, id
FROM users WHERE email = 'james@wheelzup.com';

INSERT INTO channels (name, description, type, is_private, created_by) 
SELECT 'Announcements', 'Important company-wide announcements', 'announcement', false, id
FROM users WHERE email = 'james@wheelzup.com';

-- Add James to all channels as admin
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, u.id, 'admin'
FROM channels c, users u
WHERE u.email = 'james@wheelzup.com';

-- Show what we have
SELECT 'User:' as type, email, username, role FROM users WHERE email = 'james@wheelzup.com';
SELECT 'Channels:' as type, name, type as channel_type FROM channels ORDER BY name;
SELECT 'Memberships:' as type, c.name as channel, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id 
WHERE u.email = 'james@wheelzup.com'
ORDER BY c.name;
