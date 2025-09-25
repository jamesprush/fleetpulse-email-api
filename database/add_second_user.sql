-- Add a second user for testing FleetPulse Connect
-- This creates Wes Johnson as a driver for cross-device testing

-- Step 1: Create Authentication User
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Email: wes@wheelzup.com
-- Password: password123
-- (You need to do this manually in the Supabase dashboard)

-- Step 2: Add User Profile to Database
-- Run this SQL after creating the auth user
INSERT INTO users (email, username, display_name, role, status) 
VALUES ('wes@wheelzup.com', 'wes.driver', 'Wes Johnson', 'driver', 'online')
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Step 3: Add Wes to all channels
INSERT INTO channel_members (channel_id, user_id, role) 
SELECT c.id, u.id, 'member'
FROM channels c, users u
WHERE u.email = 'wes@wheelzup.com'
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- Verification
SELECT 'User setup complete!' as status;
SELECT 'Users:', email, username, display_name, role FROM users;
SELECT 'Channel memberships:', c.name, u.display_name, cm.role 
FROM channel_members cm 
JOIN channels c ON cm.channel_id = c.id 
JOIN users u ON cm.user_id = u.id;
