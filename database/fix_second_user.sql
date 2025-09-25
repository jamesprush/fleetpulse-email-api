-- Fix the second user (prush@mail.com) by adding them to channels
-- This will work regardless of the email/username you used

-- First, let's see what users we have
SELECT 'Current Users:' as info;
SELECT id, email, username, display_name, role FROM users;

-- Add the second user to all channels (replace 'prush@mail.com' with your actual email)
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, u.id, 'member'
FROM channels c, users u
WHERE u.email = 'prush@mail.com'  -- Change this to your actual email
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- Verification - show channel memberships
SELECT 'Channel Memberships After Fix:' as info;
SELECT c.name as channel_name, u.email, u.display_name, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id
ORDER BY c.name, u.email;
