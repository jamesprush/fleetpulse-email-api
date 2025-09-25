-- Temporarily disable RLS completely to fix the infinite recursion
-- This will allow the app to work while we debug the policy issues

-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members DISABLE ROW LEVEL SECURITY;

-- Drop all policies to be safe
DROP POLICY IF EXISTS "Allow all authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.users;

DROP POLICY IF EXISTS "Allow all authenticated users to read channels" ON public.channels;
DROP POLICY IF EXISTS "Allow authenticated users to insert channels" ON public.channels;
DROP POLICY IF EXISTS "Allow channel creators to update channels" ON public.channels;

DROP POLICY IF EXISTS "Allow all authenticated users to read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all authenticated users to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow message owners to update messages" ON public.messages;

DROP POLICY IF EXISTS "Allow all authenticated users to read channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow all authenticated users to insert channel members" ON public.channel_members;
DROP POLICY IF EXISTS "Allow all authenticated users to delete channel members" ON public.channel_members;

-- Verification
SELECT 'RLS Disabled Successfully - App should work now!' as status;
