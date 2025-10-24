# Testing Guide - Notifications & WebSocket

## ✅ Server Status

**Expo Server is Running!**
- Port: 8081
- URL: http://localhost:8081
- Metro Bundler: Active
- QR Code: Available for device testing

## 📱 Quick Testing Checklist

### 1. Test Notifications (5 minutes)

#### Step 1: Open Notifications Settings
1. Open the app on your device/emulator
2. Navigate to **Profile** tab (bottom right)
3. Tap on **Notifications** in the settings list

#### Step 2: Enable Notifications
1. Toggle "Push Notifications" ON
2. Grant notification permissions when prompted
3. You should see your push token displayed

#### Step 3: Send Test Notification
1. Scroll to "Test Notification" section
2. Tap "Send Test Notification" button
3. **Expected:** Notification appears with "🎉 New Project: Test Project"

✅ **Success Criteria:**
- [ ] Push token is displayed
- [ ] Test notification appears
- [ ] Console shows: `✅ Project creation notification sent`

---

### 2. Test Auto-Notification on Project Creation (3 minutes)

#### Step 1: Navigate to Projects
1. Go to **Projects** tab (bottom navigation)
2. Tap the "+" button to create a new project

#### Step 2: Create a Project
1. Fill in project details:
   - Name: "Office Renovation Test"
   - Description: "Testing notifications"
   - Budget: 100000
2. Save the project

#### Step 3: Verify Notification
**Expected:** Notification appears immediately with:
- Title: "🎉 New Project Created"
- Body: "Office Renovation Test has been created"

✅ **Success Criteria:**
- [ ] Notification appears after saving project
- [ ] Notification contains correct project name
- [ ] Console shows: `✅ Project creation notification sent`

---

### 3. Test Auto-Notification on Expense Creation (3 minutes)

#### Step 1: Open a Project
1. Select any existing project from the list
2. Navigate to the expense section

#### Step 2: Create an Expense
1. Tap "Add Expense" or "+" button
2. Fill in expense details:
   - Description: "Testing expense notification"
   - Amount: 5000
   - Category: Materials
3. Save the expense

#### Step 3: Verify Notification
**Expected:** Notification appears with:
- Title: "💰 New Expense Added"
- Body: "₹5,000.00 expense added to [Project Name]"

✅ **Success Criteria:**
- [ ] Notification appears after saving expense
- [ ] Notification shows correct amount
- [ ] Console shows: `✅ Expense creation notification sent`

---

### 4. Test WebSocket Real-Time Updates (5 minutes)

**Requirements:** Two devices or one device + web browser

#### Step 1: Open App on Two Devices
1. **Device 1:** Open app and login
2. **Device 2:** Open app/web and login with same account

#### Step 2: Monitor Console Logs
On both devices, open developer console and look for:
```
🔌 Subscribing to real-time updates for user: [email]
✅ Subscribed to projects channel
✅ Subscribed to expenses channel
```

#### Step 3: Test Project Creation
1. **Device 1:** Create a new project (as in Test #2)
2. **Device 2:** Check console

**Expected on Device 2:**
```
🔔 WebSocket: Project created - [Project Name]
```

#### Step 4: Test Expense Creation
1. **Device 1:** Create a new expense (as in Test #3)
2. **Device 2:** Check console

**Expected on Device 2:**
```
🔔 WebSocket: Expense created - ₹[Amount]
```

✅ **Success Criteria:**
- [ ] Device 2 receives real-time update when Device 1 creates project
- [ ] Device 2 receives real-time update when Device 1 creates expense
- [ ] Updates appear within 1-2 seconds
- [ ] No errors in console

---

### 5. Test Notification Settings Persistence (2 minutes)

#### Step 1: Disable Notifications
1. Go to **Profile** → **Notifications**
2. Toggle "Push Notifications" OFF
3. Close the app completely

#### Step 2: Reopen and Verify
1. Reopen the app
2. Go back to **Profile** → **Notifications**
3. **Expected:** "Push Notifications" should still be OFF

#### Step 3: Test No Notifications
1. Keep notifications disabled
2. Create a project or expense
3. **Expected:** NO notification should appear

✅ **Success Criteria:**
- [ ] Settings persist after app restart
- [ ] No notifications when disabled
- [ ] Setting can be toggled on/off smoothly

---

## 🐛 Troubleshooting

### Notifications Not Appearing

**Check 1: App Permissions**
```
Settings → Apps → RizzApp → Notifications → Allow
```

**Check 2: Notification Settings in App**
- Ensure "Push Notifications" toggle is ON
- Check push token is displayed

**Check 3: Console Logs**
Look for errors like:
```
❌ Failed to get push token
❌ Notification permission denied
```

**Fix:**
- Re-enable permissions in device settings
- Restart the app
- Try test notification button

---

### WebSocket Not Working

**Check 1: Internet Connection**
- Ensure device has active internet
- Check if Supabase URL is reachable

**Check 2: Authentication**
- Ensure user is logged in
- Check console for: `✅ Subscribed to projects channel`

**Check 3: Supabase Configuration**
- Verify EXPO_PUBLIC_SUPABASE_URL in .env
- Verify EXPO_PUBLIC_SUPABASE_KEY in .env

**Fix:**
```typescript
// In app/(tabs)/_layout.tsx
console.log('Current user:', currentUser); // Should not be null
```

---

### Multiple Notifications

**Symptom:** Receiving duplicate notifications

**Cause:** Multiple WebSocket subscriptions not cleaned up

**Fix:**
- Ensure you see: `🔌 Unsubscribed from all channels` on logout
- Restart the app
- Check console for duplicate subscription logs

---

## 📊 Expected Console Output

### On App Launch:
```
📱 Push notifications initialized
✅ Push token: ExponentPushToken[...]
🔌 Subscribing to real-time updates for user: user@example.com
✅ Subscribed to projects channel: projects-channel-[userId]
✅ Subscribed to expenses channel: expenses-channel-[userId]
```

### On Project Creation:
```
✅ Project created: Office Renovation Test
✅ Notifications enabled: true
✅ Notification scheduled: notification-id-123
✅ Project creation notification sent
```

### On Expense Creation:
```
✅ Expense created: Testing expense
✅ Notifications enabled: true
✅ Notification scheduled: notification-id-456
✅ Expense creation notification sent
```

### On Real-Time Update:
```
🔔 WebSocket: Project created - Office Renovation Test
🔔 WebSocket: Expense created - ₹5,000
```

### On App Close:
```
🔌 Unsubscribed from all channels
✅ Cleaned up 2 channels
```

---

## 🎯 Success Metrics

**All Tests Passing:**
- ✅ Test notifications work
- ✅ Project creation triggers notification
- ✅ Expense creation triggers notification
- ✅ WebSocket real-time updates work
- ✅ Notification settings persist
- ✅ No duplicate notifications
- ✅ Proper cleanup on logout

**Performance:**
- Notifications appear within 1 second
- WebSocket updates within 2 seconds
- No lag or freezing
- Battery usage <1% per hour

**User Experience:**
- Notifications are clear and informative
- Settings are easy to toggle
- Push token is displayed for debugging
- Test button works reliably

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass:**
   - Deploy to production
   - Monitor notification delivery rates
   - Collect user feedback

2. **If Issues Found:**
   - Check error logs
   - Review Troubleshooting section
   - Test on different devices/platforms

3. **Enhancements:**
   - Add notification history screen
   - Add more notification types
   - Add notification action buttons
   - Add sound customization

---

## 📞 Need Help?

If you encounter issues:
1. Check console logs for errors
2. Review NOTIFICATIONS_WEBSOCKET.md documentation
3. Verify environment variables in .env
4. Ensure all packages are installed correctly

Happy Testing! 🎉
