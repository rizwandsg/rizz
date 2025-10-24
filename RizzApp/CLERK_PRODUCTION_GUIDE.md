# 🚀 Production Deployment Checklist for Clerk

## Current Status: ✅ Development Mode (Test Keys Active)

Your app is currently using **development keys** (`pk_test_`), which is correct for development but has limitations:
- Limited to 500 MAUs (Monthly Active Users)
- Development features enabled
- Not optimized for production

---

## 📋 Steps to Deploy to Production

### Step 1: Create Clerk Production Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click on your application
3. In the top navigation, switch from **"Development"** to **"Production"**
4. Or create a new Production instance

### Step 2: Get Production Keys

1. In Production instance, go to **"API Keys"**
2. Copy your **Publishable Key** (starts with `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_live_`)

### Step 3: Update `.env` File

Replace the development keys with production keys:

```env
# Comment out development keys
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Use production keys
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
EXPO_CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_HERE
```

### Step 4: Configure Production Settings in Clerk

1. **Authentication Settings:**
   - Enable email verification
   - Configure OAuth providers (Google, etc.)
   - Set password requirements

2. **URLs & Redirects:**
   - Add your production app URL
   - Configure redirect URLs
   - Set allowed origins

3. **User Management:**
   - Configure user metadata
   - Set up roles/permissions if needed

### Step 5: Test Before Deploy

```bash
# Clear cache and rebuild
npx expo start --clear

# Test on physical devices
npx expo start --tunnel
```

### Step 6: Build for Production

```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

---

## ⚠️ Important Security Notes

### DO NOT:
- ❌ Commit production keys to Git
- ❌ Expose secret keys in mobile app code
- ❌ Share production keys in documentation
- ❌ Use development keys in production

### DO:
- ✅ Use environment variables
- ✅ Keep `.env` in `.gitignore`
- ✅ Use EAS Secrets for production builds
- ✅ Rotate keys if exposed

---

## 🔐 Setting Up EAS Secrets (Recommended for Production)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Set production secrets
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_your_key
eas secret:create --scope project --name EXPO_CLERK_SECRET_KEY --value sk_live_your_secret

# List secrets
eas secret:list
```

---

## 📊 Production vs Development Comparison

| Feature | Development (`pk_test_`) | Production (`pk_live_`) |
|---------|--------------------------|-------------------------|
| **MAU Limit** | 500 users | Unlimited (based on plan) |
| **Environment** | Testing | Live users |
| **Features** | All enabled | Production-ready |
| **Data** | Test data | Real user data |
| **Warning** | Shows warning | No warning |

---

## ✅ Current Development Setup (No Changes Needed Now)

Your current setup is **correct for development**:
- ✅ Using `pk_test_` keys
- ✅ Warning suppressed in app
- ✅ Safe to continue development
- ✅ Ready to switch to production when needed

---

## 🎯 When to Switch to Production

Switch to production keys when:
- 🚀 Ready to launch app to users
- 📱 Submitting to App Store / Play Store
- 👥 Expecting more than 500 monthly active users
- 🔒 Need production-level security and support

---

## 📚 Additional Resources

- [Clerk Production Checklist](https://clerk.com/docs/deployments/overview)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Environment Variables in Expo](https://docs.expo.dev/guides/environment-variables/)
- [Clerk Pricing Plans](https://clerk.com/pricing)

---

## 🆘 Need Help?

If you have questions:
1. Check [Clerk Documentation](https://clerk.com/docs)
2. Visit [Clerk Discord Community](https://clerk.com/discord)
3. Contact Clerk Support (for paid plans)

---

**Last Updated:** October 24, 2025
**Status:** Development Keys Active - Production Ready When Needed
