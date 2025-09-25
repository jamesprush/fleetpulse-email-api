# 🚀 FleetPulse Connect - Supabase Setup Guide

## **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/Login with GitHub
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name:** `fleetpulse-connect`
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

## **Step 2: Get Your Credentials**

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## **Step 3: Update Configuration**

1. Open `config/supabase.ts`
2. Replace the placeholder values:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key
```

## **Step 4: Set Up Database**

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New query"
3. Copy and paste the entire contents of `database/schema_fixed_v2.sql`
4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned" messages

## **Step 5: Create Your User Profile**

1. **Create Authentication User:**
   - Go to **Authentication** → **Users**
   - Click "Add user"
   - **Email:** `james@WheelzUp.com`
   - **Password:** `password123`
   - Click "Create user"

2. **Create User Profile in Database:**
   - Go to **SQL Editor** in Supabase
   - Click "New query"
   - Copy and paste the contents of `database/simple_setup.sql`
   - Click "Run" to execute
   - This creates your user profile and all channels automatically

## **Step 6: Test the App**

1. Run your Expo app: `npx expo start`
2. Navigate to **FleetPulse Connect**
3. You should see the login screen
4. Login with: `james@WheelzUp.com` / `password123`
5. You should see the messaging interface with channels:
   - **General** - Driver discussions
   - **Vehicle Issues** - Truck problems
   - **Management** - Leadership discussions (private)
   - **Announcements** - Company-wide updates

## **Step 7: Enable Real-time (Optional)**

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - `messages`
   - `typing_indicators`
   - `users`

## **🎉 You're Done!**

Your FleetPulse Connect now has:
- ✅ **Real-time messaging** between devices
- ✅ **User authentication** with email/password
- ✅ **Channel management** with permissions
- ✅ **Typing indicators** 
- ✅ **Message persistence** in database
- ✅ **Professional UI** like Discord/Telegram

## **💰 Cost Breakdown**

- **Development:** FREE (2GB bandwidth, 500MB database)
- **Production:** $25/month (250GB bandwidth, 8GB database)
- **Perfect for 10-500 users!**

## **🔧 Troubleshooting**

### **"Invalid API key" error:**
- Double-check your URL and anon key in `config/supabase.ts`
- Make sure there are no extra spaces or quotes

### **"User not found" error:**
- Make sure you created the authentication user in Supabase
- Run the `simple_setup.sql` to create your user profile
- Check that your email matches exactly (`james@WheelzUp.com`)

### **Messages not syncing:**
- Check that you ran both SQL files (`schema_fixed_v2.sql` and `simple_setup.sql`)
- Verify real-time is enabled for the `messages` table

### **Login not working:**
- Check the user exists in Supabase Authentication
- Verify the email/password are correct
- Check the browser console for error messages

## **🚀 Next Steps**

1. **Customize channels** - Edit the sample channels in the SQL
2. **Add more users** - Create additional test accounts
3. **File sharing** - Enable Supabase Storage for images/files
4. **Push notifications** - Add Expo Push Notifications
5. **Voice calls** - Integrate WebRTC for voice/video

## **📞 Support**

If you run into issues:
1. Check the Supabase dashboard logs
2. Look at the Expo console for errors
3. Verify all credentials are correct
4. Make sure the database schema was applied successfully

**Happy messaging! 🎉**
