// Supabase configuration for FleetPulse Connect
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
// Get these from: https://supabase.com/dashboard/project/[your-project]/settings/api
const SUPABASE_URL = 'https://ppndqsngqqrpofysehaj.supabase.co'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbmRxc25ncXFycG9meXNlaGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjY2MjcsImV4cCI6MjA3NDI0MjYyN30.Trdgo0F3L4s19mA82KuuGaurYZif4y9cF4FvxVcJF8E'; // Replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database table names
export const TABLES = {
  USERS: 'users',
  CHANNELS: 'channels',
  MESSAGES: 'messages',
  CHANNEL_MEMBERS: 'channel_members'
} as const;

// Real-time channel names
export const REALTIME_CHANNELS = {
  MESSAGES: 'messages',
  TYPING: 'typing',
  USERS: 'users'
} as const;
