# 🧪 Add Second User for Testing

Follow these steps to add a second user so you can test messaging between your PC emulator and iPhone.

## **Step 1: Create Authentication User in Supabase**

1. **Go to Supabase Dashboard** → **Authentication** → **Users**
2. **Click "Add User"**
3. **Fill in:**
   - **Email:** `wes@wheelzup.com`
   - **Password:** `password123`
   - **Auto Confirm User:** ✅ (check this box)
4. **Click "Create User"**

## **Step 2: Add User Profile to Database**

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the contents of `database/add_second_user.sql`
3. **Click "Run"**
4. **You should see:** `User setup complete!` and user/channel information

## **Step 3: Test Cross-Device Messaging**

### **On Your PC (Android Emulator):**
- Login with: `james@wheelzup.com` / `password123`
- You should see "James Prush" as the sender

### **On Your iPhone:**
- Login with: `wes@wheelzup.com` / `password123`  
- You should see "Wes Johnson" as the sender

## **Step 4: Test Real-Time Messaging**

1. **Open FleetPulse Connect on both devices**
2. **Select the same channel (e.g., "General")**
3. **Send messages from one device**
4. **Watch them appear instantly on the other device!**

## **Expected Result:**
- ✅ **James** can send messages from PC
- ✅ **Wes** can send messages from iPhone
- ✅ **Real-time sync** between devices
- ✅ **Proper user names** displayed
- ✅ **Keyboard works properly** on both devices

## **Troubleshooting:**
- If user names still show "Unknown User", restart both apps
- If messages don't sync, check that both devices are using the same Supabase project
- If keyboard covers input, the fix should resolve this automatically

Happy testing! 🚀
