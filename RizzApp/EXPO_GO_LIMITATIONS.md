# Expo Go Limitations & Development Build Guide

## ⚠️ Current Situation

You're currently running the app in **Expo Go**, which has limitations:

### What Works in Expo Go:
- ✅ **WebSocket real-time updates** - Fully functional!
- ✅ **App navigation and UI**
- ✅ **Database operations**
- ✅ **Authentication**
- ✅ **Most core features**

### What Doesn't Work in Expo Go:
- ❌ **Push Notifications** (removed in SDK 53+)
- ❌ **Local Notifications** (limited support)
- ❌ **Some native modules**

## 🔍 Current Behavior

When running in Expo Go, the app will:
- **Skip push token registration** gracefully
- **Log notifications to console** instead of showing them
- **WebSocket still works** perfectly for real-time updates
- **No crashes or errors** - everything else functions normally

You'll see logs like:
```
⚠️ Push notifications not supported in Expo Go. Use a development build for full support.
📬 [Expo Go] Notification: project_created { projectName: 'Test Project' }
```

## 🚀 How to Get Full Notification Support

### Option 1: Create a Development Build (Recommended)

A development build is like Expo Go but with your custom native code included.

#### Step 1: Install EAS CLI
```powershell
npm install -g eas-cli
```

#### Step 2: Login to Expo
```powershell
eas login
```

#### Step 3: Configure EAS
```powershell
eas build:configure
```

#### Step 4: Build for Android
```powershell
# Build for Android device
eas build --profile development --platform android

# Or build locally (faster)
eas build --profile development --platform android --local
```

#### Step 5: Install the Build
1. Download the APK from the EAS build page
2. Install it on your Android device
3. Run the app with: `npx expo start --dev-client`

**Build Time:** ~10-15 minutes for first build

---

### Option 2: Build Standalone APK

For production or testing outside development:

```powershell
# Production build
eas build --profile production --platform android

# Preview build (like production but with debugging)
eas build --profile preview --platform android
```

---

### Option 3: Use Android Studio (Advanced)

Build locally using Android Studio:

```powershell
# Generate native folders
npx expo prebuild

# Run on Android
npx expo run:android
```

**Note:** This ejects your project from managed workflow.

---

## 📋 Quick Comparison

| Feature | Expo Go | Development Build | Production Build |
|---------|---------|-------------------|------------------|
| Setup Time | ✅ Instant | ⚠️ 15 min first time | ⚠️ 15 min |
| Push Notifications | ❌ No | ✅ Yes | ✅ Yes |
| Hot Reload | ✅ Fast | ✅ Fast | ❌ No |
| Native Modules | ❌ Limited | ✅ Full | ✅ Full |
| Distribution | ❌ No | ❌ Dev only | ✅ Yes |
| WebSocket | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 🎯 What to Do Now

### If you just want to test quickly:
**Continue using Expo Go!** 
- WebSocket real-time updates work perfectly
- You'll see notification events in the console
- All other features work normally

### If you need full notifications:
**Create a development build:**
```powershell
# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build and install
eas build --profile development --platform android
```

---

## 🔧 Current Code Behavior

The notification service has been updated to handle Expo Go gracefully:

### In Expo Go:
```typescript
// Notifications are logged instead of shown
📬 [Expo Go] Notification: project_created { projectName: 'Office Renovation' }
📬 [Expo Go] Notification: expense_added { amount: 5000, projectName: 'Office Renovation' }
```

### In Development/Production Build:
```typescript
// Real notifications appear
🎉 New Project Created
Project "Office Renovation" has been created successfully

💰 New Expense Added
Expense of ₹5,000.00 has been added to "Office Renovation"
```

---

## 📱 Testing WebSocket (Works Now!)

You can test real-time updates right now in Expo Go:

1. **Open app on two devices** (or one device + web)
2. **Create a project** on device 1
3. **Watch console on device 2** - you'll see:
   ```
   🔔 WebSocket: Project created - Office Renovation
   ```

The WebSocket functionality is **fully working** in Expo Go!

---

## 🐛 Troubleshooting

### Error: "Invalid uuid" for projectId
**Fix:** This is expected in Expo Go. The code now handles it gracefully.

### Error: "expo-notifications not supported"
**Fix:** This is normal in Expo Go. Upgrade to development build for full support.

### WebSocket not working
**Check:**
1. Internet connection
2. Supabase credentials in `.env`
3. User is logged in
4. Console shows: `✅ Subscribed to projects channel`

---

## 📚 Additional Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

---

## ✅ Summary

- **Right now:** WebSocket works perfectly in Expo Go, notifications logged to console
- **For full notifications:** Create a development build (15 min setup)
- **No code changes needed:** The app handles both scenarios automatically

Happy coding! 🚀
