-- FleetPulse Connect Database Schema (Supabase Compatible)
-- Run this in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'driver')),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  avatar_url TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('text', 'announcement', 'voice')),
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channel_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS channel_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'system')),
  reply_to UUID REFERENCES messages(id),
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create message_reads table (for read receipts)
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel_id ON typing_indicators(channel_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data and other users' public data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read other users' public data" ON users
  FOR SELECT USING (true);

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Channel members can read channels they're in
CREATE POLICY "Channel members can read channels" ON channels
  FOR SELECT USING (
    id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    )
  );

-- Channel members can read messages in their channels
CREATE POLICY "Channel members can read messages" ON messages
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    )
  );

-- Channel members can insert messages
CREATE POLICY "Channel members can insert messages" ON messages
  FOR INSERT WITH CHECK (
    channel_id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Channel members can read channel members
CREATE POLICY "Channel members can read channel members" ON channel_members
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM channel_members 
      WHERE user_id = auth.uid()
    )
  );

-- Insert sample data
INSERT INTO users (id, email, username, display_name, role, status) VALUES
  ('admin1', 'james@WheelzUp.com', 'james.admin', 'James Prush', 'admin', 'online'),
  ('driver1', 'wes@WheelzUp.com', 'wes.driver', 'Wes Johnson', 'driver', 'online')
ON CONFLICT (id) DO NOTHING;

INSERT INTO channels (id, name, description, type, is_private, created_by) VALUES
  ('drivers-general', 'General', 'General driver discussions and announcements', 'text', false, 'admin1'),
  ('vehicle-issues', 'Vehicle Issues', 'Report truck problems and maintenance requests', 'text', false, 'admin1'),
  ('management', 'Management', 'Leadership and management discussions', 'text', true, 'admin1'),
  ('announcements', 'Announcements', 'Important company-wide announcements', 'announcement', false, 'admin1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO channel_members (channel_id, user_id, role) VALUES
  ('drivers-general', 'admin1', 'admin'),
  ('drivers-general', 'driver1', 'member'),
  ('vehicle-issues', 'admin1', 'admin'),
  ('vehicle-issues', 'driver1', 'member'),
  ('management', 'admin1', 'admin'),
  ('announcements', 'admin1', 'admin'),
  ('announcements', 'driver1', 'member')
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
