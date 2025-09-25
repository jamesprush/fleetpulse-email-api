# 🔐 FleetPulse Supabase Authentication Setup

## 📋 **INTEGRATING WITH YOUR EXISTING SUPABASE SYSTEM**

---

## **1. 🎯 OVERVIEW**

### **Why Use Supabase Instead of Custom Auth:**
- ✅ **Already Set Up** - You have Supabase configured for FleetConnect
- ✅ **Secure & Scalable** - Enterprise-grade authentication
- ✅ **Real-time Features** - Built-in real-time capabilities
- ✅ **User Management** - Built-in user management dashboard
- ✅ **Row Level Security** - Database-level security policies
- ✅ **Consistent System** - Same auth for all your apps

---

## **2. 🔧 CURRENT SUPABASE SETUP**

### **Your Existing Configuration:**
```typescript
// config/supabase.ts
const SUPABASE_URL = 'https://ppndqsngqqrpofysehaj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### **Existing Tables:**
- `users` - User accounts
- `channels` - FleetConnect channels  
- `messages` - FleetConnect messages
- `channel_members` - Channel memberships

---

## **3. 🗄️ DATABASE SCHEMA UPDATES**

### **Step 3.1: Update Users Table**

```sql
-- Add FleetPulse-specific columns to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fleetpulse_roles TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fleetpulse_permissions TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### **Step 3.2: Create FleetPulse-Specific Tables**

```sql
-- FleetPulse Notes Data
CREATE TABLE IF NOT EXISTS fleetpulse_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  week_start_date DATE,
  day_of_week TEXT,
  division TEXT, -- 'dmv' or 'nyc'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FleetPulse Writeups
CREATE TABLE IF NOT EXISTS fleetpulse_writeups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  week_start_date DATE,
  day_of_week TEXT,
  division TEXT,
  driver_name TEXT,
  writeup_text TEXT,
  writeup_type TEXT, -- 'ncns', 'late', 'callout', 'accident', 'other'
  is_completed BOOLEAN DEFAULT false,
  submitted_to_hr BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FleetPulse Training
CREATE TABLE IF NOT EXISTS fleetpulse_training (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  week_start_date DATE,
  day_of_week TEXT,
  driver_name TEXT,
  location TEXT,
  trainer TEXT,
  van TEXT,
  division TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FleetPulse Weekly Reports
CREATE TABLE IF NOT EXISTS fleetpulse_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  week_start_date DATE,
  report_content TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_recipients TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## **4. 🔒 ROW LEVEL SECURITY (RLS) POLICIES**

### **Step 4.1: Enable RLS on Tables**

```sql
-- Enable RLS on all FleetPulse tables
ALTER TABLE fleetpulse_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleetpulse_writeups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleetpulse_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleetpulse_reports ENABLE ROW LEVEL SECURITY;
```

### **Step 4.2: Create Security Policies**

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own notes" ON fleetpulse_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON fleetpulse_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON fleetpulse_notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Managers can see all data in their division
CREATE POLICY "Managers can view all notes" ON fleetpulse_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND 'manager' = ANY(fleetpulse_roles)
    )
  );

-- Admins can see everything
CREATE POLICY "Admins can view all notes" ON fleetpulse_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND 'admin' = ANY(fleetpulse_roles)
    )
  );
```

---

## **5. 🔧 AUTHENTICATION CONTEXT UPDATE**

### **Step 5.1: Update AuthContext.tsx**

```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';

export type Role = 'driver' | 'manager' | 'admin';

type FleetPulseUser = {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  permissions: string[];
  last_login?: string;
};

type AuthCtx = {
  user: FleetPulseUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<FleetPulseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      const fleetPulseUser: FleetPulseUser = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: data.name || data.email,
        roles: data.fleetpulse_roles || [],
        permissions: data.fleetpulse_permissions || [],
        last_login: data.last_login
      };

      setUser(fleetPulseUser);

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', supabaseUser.id);

    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (...roles: Role[]) => {
    if (!user) return false;
    return roles.some(r => user.roles.includes(r));
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const value: AuthCtx = {
    user,
    session,
    loading,
    signIn,
    signOut,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

---

## **6. 📱 LOGIN SCREEN UPDATE**

### **Step 6.1: Update LoginScreen.tsx**

```typescript
// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FleetPulse</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## **7. 👥 USER MANAGEMENT**

### **Step 7.1: Create User Management Screen**

```typescript
// screens/UserManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';

export default function UserManagementScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, hasRole } = useAuth();

  useEffect(() => {
    if (hasRole('admin')) {
      loadUsers();
    }
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoles = async (userId: string, roles: string[]) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ fleetpulse_roles: roles })
        .eq('id', userId);

      if (error) throw error;
      loadUsers(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to update user roles');
    }
  };

  if (!hasRole('admin')) {
    return (
      <View style={styles.container}>
        <Text>Access Denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userRoles}>
              Roles: {item.fleetpulse_roles?.join(', ') || 'None'}
            </Text>
            {/* Add role editing functionality here */}
          </View>
        )}
      />
    </View>
  );
}
```

---

## **8. 🚀 DEPLOYMENT STEPS**

### **Step 8.1: Database Setup**
1. **Run SQL Scripts** - Execute the database schema updates
2. **Create RLS Policies** - Set up security policies
3. **Test Database** - Verify tables and permissions work

### **Step 8.2: User Account Creation**
1. **Create Admin Account** - Set up your admin user
2. **Create Team Accounts** - Add your team members
3. **Set Roles** - Assign appropriate roles to each user

### **Step 8.3: App Integration**
1. **Update AuthContext** - Replace with Supabase auth
2. **Update LoginScreen** - Use Supabase authentication
3. **Test Login Flow** - Verify authentication works
4. **Test Permissions** - Verify role-based access

---

## **9. 🎯 BENEFITS OF SUPABASE AUTH**

### **Security:**
- ✅ **Enterprise-grade security**
- ✅ **Row Level Security (RLS)**
- ✅ **Automatic session management**
- ✅ **Secure password handling**

### **Scalability:**
- ✅ **Built for scale**
- ✅ **Real-time capabilities**
- ✅ **Automatic backups**
- ✅ **Global CDN**

### **Management:**
- ✅ **Supabase Dashboard** for user management
- ✅ **Built-in analytics**
- ✅ **Easy user creation/deletion**
- ✅ **Role management**

---

## **10. 🔧 TROUBLESHOOTING**

### **Common Issues:**

1. **Login Not Working:**
   - Check Supabase URL and keys
   - Verify user exists in database
   - Check RLS policies

2. **Permission Denied:**
   - Verify user roles in database
   - Check RLS policies
   - Ensure user is active

3. **Session Issues:**
   - Check session persistence settings
   - Verify auto-refresh is enabled
   - Clear app data if needed

---

**🎉 Your FleetPulse app now uses enterprise-grade Supabase authentication!**
