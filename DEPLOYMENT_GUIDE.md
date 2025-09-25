# 🚀 FleetPulse Deployment Guide

## 📋 **COMPLETE STEP-BY-STEP DEPLOYMENT PROCESS**

---

## **1. 📧 EMAIL SETUP (Priority 1)**

### **Step 1.1: Deploy to Vercel**
```bash
# 1. Go to vercel.com and login
# 2. Click "New Project"
# 3. Import your GitHub repo (or drag/drop your project folder)
# 4. Set Framework Preset: "Other" or "Node.js"
# 5. Set Root Directory: "." (or leave default)
# 6. Click "Deploy"
```

### **Step 1.2: Get Resend API Key**
```bash
# 1. Go to resend.com
# 2. Sign up/login
# 3. Go to "API Keys"
# 4. Click "Create API Key"
# 5. Name it "FleetPulse"
# 6. Copy the key (starts with re_)
```

### **Step 1.3: Set Environment Variables in Vercel**
```bash
# 1. Go to your Vercel project dashboard
# 2. Click "Settings" tab
# 3. Click "Environment Variables" in sidebar
# 4. Add these variables:
#    Name: RESEND_API_KEY
#    Value: [Your Resend API key from step 1.2]
# 5. Click "Save"
# 6. Redeploy your project (click "Deployments" → "..." → "Redeploy")
```

### **Step 1.4: Update App Environment**
```bash
# In your app's .env file or app config, add:
EXPO_PUBLIC_EMAIL_API_URL=https://your-project-name.vercel.app
# (Replace your-project-name with your actual Vercel URL)
```

---

## **2. 🔐 LOGIN SYSTEM SETUP (SUPABASE)**

### **Step 2.1: Use Existing Supabase Setup**
```bash
# ✅ You already have Supabase configured for FleetConnect
# ✅ Use the same authentication system for FleetPulse
# ✅ Follow SUPABASE_AUTH_SETUP.md for detailed implementation
```

### **Step 2.2: Database Schema Updates**
```bash
# 1. Add FleetPulse columns to existing users table
# 2. Create FleetPulse-specific tables (notes, writeups, training)
# 3. Set up Row Level Security (RLS) policies
# 4. Test database permissions
```

### **Step 2.3: Update Authentication Context**
```bash
# 1. Replace custom auth with Supabase auth
# 2. Update LoginScreen to use Supabase
# 3. Add user management screen
# 4. Test login flow and permissions
```

---

## **3. 📅 WEEKLY RESET SYSTEM**

### **Step 3.1: Auto-Email on Reset**
```bash
# When notes are reset:
# 1. Send weekly report email to prush@mail.com
# 2. Include all notes, writeups, and training data
# 3. Clear all data for new week
# 4. Update calendar to next week's dates
```

### **Step 3.2: Calendar Date Management**
```bash
# Example: Reset on Friday 9/26
# Monday becomes: 9/29
# Tuesday becomes: 9/30
# Wednesday becomes: 10/1
# etc.
```

---

## **4. 🔄 PROJECT SPLITTING (Developer vs Live Mode)**

### **Step 4.1: Create Environment Modes**
```bash
# Create .env.development
EXPO_PUBLIC_MODE=development
EXPO_PUBLIC_SHOW_ALL_APPS=true

# Create .env.production
EXPO_PUBLIC_MODE=production
EXPO_PUBLIC_SHOW_ALL_APPS=false
```

### **Step 4.2: Update HubScreen.tsx**
```bash
# Add conditional rendering:
# - Development mode: Show all apps (including incomplete ones)
# - Production mode: Show only completed apps
```

### **Step 4.3: Create Separate Branches**
```bash
# Development branch: For ongoing development
# Production branch: For stable releases
# Master branch: For team distribution
```

---

## **5. 📱 APP DISTRIBUTION**

### **Step 5.1: Build for Android**
```bash
# 1. Install EAS CLI
npm install -g @expo/eas-cli

# 2. Login to Expo
eas login

# 3. Configure EAS Build
eas build:configure

# 4. Build Android APK
eas build --platform android --profile preview

# 5. Download and distribute APK to your team
```

### **Step 5.2: Build for iOS**
```bash
# 1. Build iOS app
eas build --platform ios --profile preview

# 2. For internal testing, use TestFlight
# 3. For App Store, use production profile
```

### **Step 5.3: Team Distribution**
```bash
# Option 1: Direct APK distribution (Android)
# - Send APK file to team members
# - They install directly on their devices

# Option 2: TestFlight (iOS)
# - Upload to TestFlight
# - Invite team members via email

# Option 3: Internal App Store
# - Use Expo's internal distribution
# - Team members install via Expo Go app
```

---

## **6. 🎯 COMPLETION CHECKLIST**

### **Pre-Deployment Checklist:**
- [ ] Email system working (Vercel + Resend)
- [ ] Login system implemented
- [ ] Notes persistence working
- [ ] Weekly reset functionality
- [ ] Developer/Live mode toggle
- [ ] All apps marked as complete/incomplete

### **Post-Deployment Checklist:**
- [ ] Test email reports
- [ ] Test login system
- [ ] Test notes persistence
- [ ] Test weekly reset
- [ ] Build and test APK
- [ ] Distribute to team
- [ ] Collect feedback

---

## **7. 🔧 TROUBLESHOOTING**

### **Common Issues:**
1. **Email not sending**: Check Vercel environment variables
2. **Notes not saving**: Check AsyncStorage permissions
3. **Login issues**: Verify authentication service
4. **Build failures**: Check EAS configuration
5. **App crashes**: Check device compatibility

### **Support Contacts:**
- Vercel Support: vercel.com/support
- Expo Support: docs.expo.dev
- Resend Support: resend.com/support

---

## **8. 📊 MONITORING & MAINTENANCE**

### **Weekly Tasks:**
- [ ] Check email delivery reports
- [ ] Monitor app usage
- [ ] Collect user feedback
- [ ] Update team on improvements

### **Monthly Tasks:**
- [ ] Review and update user permissions
- [ ] Backup data
- [ ] Update app versions
- [ ] Plan new features

---

**🎉 Congratulations! Your FleetPulse app is ready for team deployment!**
