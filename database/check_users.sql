-- Check what users exist in the database
SELECT 'Current Users:' as info;
SELECT id, email, username, display_name, role FROM users;

-- Check channel memberships
SELECT 'Channel Memberships:' as info;
SELECT c.name as channel_name, u.email, u.display_name, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id
ORDER BY c.name, u.email;
