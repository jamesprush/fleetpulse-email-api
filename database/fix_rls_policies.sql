-- Fix infinite recursion in RLS policies
-- Drop the problematic policies first
DROP POLICY IF EXISTS "Channel members can read channel members" ON channel_members;

-- Create a simpler, non-recursive policy
CREATE POLICY "Channel members can read channel members" ON channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm2 
      WHERE cm2.channel_id = channel_members.channel_id 
      AND cm2.user_id = auth.uid()
    )
  );

-- Also fix the channels policy to avoid recursion
DROP POLICY IF EXISTS "Channel members can read channels" ON channels;

CREATE POLICY "Channel members can read channels" ON channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channels.id 
      AND cm.user_id = auth.uid()
    )
  );
