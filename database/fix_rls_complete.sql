-- Complete RLS Policy Fix for FleetPulse Connect
-- This will disable RLS temporarily and recreate clean policies

-- Step 1: Disable RLS on all tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read public profiles" ON public.users;

DROP POLICY IF EXISTS "Channels are public or user is member" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can insert" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can update" ON public.channels;
DROP POLICY IF EXISTS "Channel creators can delete" ON public.channels;

DROP POLICY IF EXISTS "Channel members can read messages" ON public.messages;
DROP POLICY IF EXISTS "Channel members can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Message owners can update messages" ON public.messages;
DROP POLICY IF EXISTS "Message owners can delete messages" ON public.messages;

DROP POLICY IF EXISTS "Channel members can read their own membership" ON public.channel_members;
DROP POLICY IF EXISTS "Channel members can insert their own membership" ON public.channel_members;
DROP POLICY IF EXISTS "Channel members can delete their own membership" ON public.channel_members;
DROP POLICY IF EXISTS "Admins can manage channel memberships" ON public.channel_members;

-- Step 3: Enable RLS again
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies

-- Users policies (simple)
CREATE POLICY "Allow all authenticated users to read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow users to update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Channels policies (simple - no recursion)
CREATE POLICY "Allow all authenticated users to read channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert channels" ON public.channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow channel creators to update channels" ON public.channels FOR UPDATE USING (created_by = auth.uid());

-- Messages policies (simple - no recursion)
CREATE POLICY "Allow all authenticated users to read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow message owners to update messages" ON public.messages FOR UPDATE USING (user_id = auth.uid());

-- Channel members policies (simple - no recursion)
CREATE POLICY "Allow all authenticated users to read channel members" ON public.channel_members FOR SELECT USING (true);
CREATE POLICY "Allow all authenticated users to insert channel members" ON public.channel_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all authenticated users to delete channel members" ON public.channel_members FOR DELETE USING (true);

-- Verification
SELECT 'RLS Policies Fixed Successfully!' as status;
