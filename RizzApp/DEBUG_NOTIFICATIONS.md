# 🔍 Notification Debug Instructions

## Step 1: Reload Your App

Press `r` in your Expo terminal or shake your device and select "Reload"

## Step 2: Test with the Test Button

1. Open the app
2. Go to **Profile** tab (bottom navigation)
3. Tap **"Notifications"**
4. Scroll down and tap **"Test Project Created"** button

## Step 3: Watch Your Console/Terminal

You should see these logs in order:

```
🧪 Testing PROJECT_CREATED notification...
🔍 Checking notification settings: <value or null>
✅ No settings found, defaulting to enabled (OR)
✅ Parsed settings: {...}
✅ Push notifications enabled: true
🔔 sendAppNotification called with type: project_created data: {...}
📬 [Expo Go] Notification: 🎉 New Project Created - Project "Test Office Renovation" has been created successfully
```

## Step 4: Create a Real Project

1. Go to **Projects** tab
2. Tap the **+** button
3. Fill in project details (just name is enough)
4. Save

Watch console for:

```
🔔 Attempting to send project creation notification...
🔍 Checking notification settings: ...
🔔 Notifications enabled: true
🔔 Calling sendAppNotification...
🔔 sendAppNotification called with type: project_created data: {...}
📬 [Expo Go] Notification: 🎉 New Project Created - Project "Your Project Name" has been created successfully
✅ Project creation notification sent
```

## Troubleshooting

### If you see "Notifications enabled: false"

**Solution:**
1. Go to Profile → Notifications
2. Make sure "Push Notifications" toggle is **ON** (blue/purple)
3. Try creating a project again

### If you don't see ANY logs at all

**Solution:**
1. Make sure your Metro bundler terminal is open and visible
2. Check if the app is connected (you should see logs when navigating)
3. Try pressing `r` to reload the app
4. Add a simple `console.log('App loaded')` to verify console works

### If you see error logs

**Copy the error and check:**
- Does it mention "module not found"? → Reload app with `r`
- Does it mention "AsyncStorage"? → Check internet connection
- Does it mention "undefined"? → Check notification settings

## Expected Behavior in Expo Go

Remember: **Expo Go CANNOT show popup notifications**

What you WILL see:
- ✅ Console logs with notification details
- ✅ Alert dialog saying "Notification Sent!"

What you WON'T see:
- ❌ Notification popup on device
- ❌ Notification in notification tray
- ❌ Notification sound

This is normal! To get real popups, you need a development build.

## Quick Verification Test

Run this in order:

1. **App loads** → Look for: `⚠️ Push notifications not supported in Expo Go`
2. **Open Notifications screen** → Look for: `✅ Push notifications initialized` or similar
3. **Tap test button** → Look for: `📬 [Expo Go] Notification: ...`
4. **Create project** → Look for: `🔔 Attempting to send...` → `📬 [Expo Go] Notification: ...`

If all 4 steps show logs, **notifications are working perfectly!**

## Still Not Working?

Share these details:
1. What you did (e.g., "pressed test button")
2. What logs you see (copy from console)
3. What you expected vs what happened
4. Any error messages (red text in console)
