# 🎯 HOW TO CREATE USERS - Step by Step

## ✅ Prerequisites Check

Your database schema is already updated! ✅ 
The columns `parent_user_id`, `role`, and `is_active` are already in your users table.

---

## 📱 How to Create Users That Can Login

### Step 1: Login to Your App
- Open your app on your phone/emulator
- Login with your credentials (e.g., `rizwankottiligal@gmail.com`)

### Step 2: Navigate to Users Tab
After login, you should see **5 tabs** at the bottom:
```
🏠 Projects  |  💰 Expenses  |  📊 Analytics  |  👥 Users  |  👤 Profile
```

👉 **Tap the "Users" tab** (4th tab with group icon)

### Step 3: Add a New User

1. **Tap the blue ➕ button** in the top-right corner

2. **Fill in the form:**
   - **Email**: `john@example.com` (must be unique)
   - **Password**: `john123` (minimum 6 characters)
   - **Full Name**: `John Doe` (required)
   - **Phone**: `+1234567890` (optional)

3. **Tap "Create" button**

4. ✅ You'll see: "User created successfully"

### Step 4: Test the New User

1. **Logout** from your account (Profile tab → Logout)

2. **Login with new user:**
   - Email: `john@example.com`
   - Password: `john123`

3. ✅ **The new user can now:**
   - See all YOUR projects
   - Add new projects (you'll see them)
   - Add expenses
   - Edit their profile
   - But CANNOT create other users (no Users tab for them)

---

## 🎨 What You'll See

### On Users Screen:

```
┌─────────────────────────────────────┐
│  Team Members              [+]      │  ← Tap + to add
├─────────────────────────────────────┤
│  Total: 0    Active: 0    Inactive: 0│
├─────────────────────────────────────┤
│                                     │
│         👥                          │
│    No team members yet              │
│                                     │
│  Add users to collaborate on        │
│         projects                    │
│                                     │
│   [ Add First Member ]              │  ← Or tap this
│                                     │
└─────────────────────────────────────┘
```

### After Adding Users:

```
┌─────────────────────────────────────┐
│  Team Members              [+]      │
├─────────────────────────────────────┤
│  Total: 2    Active: 2    Inactive: 0│
├─────────────────────────────────────┤
│  👤 John Doe                        │
│     john@example.com                │
│     📱 +1234567890                  │
│     Status: Active ✅               │
│  [Edit] [Reset] [Disable] [Delete] │
├─────────────────────────────────────┤
│  👤 Sarah Smith                     │
│     sarah@example.com               │
│     Status: Active ✅               │
│  [Edit] [Reset] [Disable] [Delete] │
└─────────────────────────────────────┘
```

---

## 🔧 User Management Actions

### ✏️ Edit User
- Tap "Edit" button
- Change name or phone
- Toggle Active/Inactive status
- Tap "Update"

### 🔄 Reset Password
- Tap "Reset" button
- Gets a new 6-digit password (e.g., `761543`)
- Share this password with the user securely

### ⏸️ Disable User
- Tap "Disable" button
- User can no longer login
- Their data remains visible
- Can re-enable anytime

### 🗑️ Delete User
- Tap "Delete" button
- Confirms deletion
- User and their data are removed permanently

---

## 🚨 IMPORTANT: Run This First!

If you DON'T see the Users tab, you need to run the migration:

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql

2. Copy and paste this entire file:
   ```
   migrations/add_user_management.sql
   ```

3. Click **RUN**

4. Wait for: `✅ MIGRATION COMPLETE!`

5. Restart your app

---

## 💡 Quick Tips

### Multiple Users Example:
```
YOU (Owner Account)
├── Can see Users tab
├── Can add team members
└── Sees all data from team

JOHN (Member)
├── Created by you
├── Can login independently
├── Sees your projects
└── Cannot manage users

SARAH (Member)
├── Created by you
├── Can login independently
├── Sees everyone's projects
└── Cannot manage users
```

### Data Sharing:
- ✅ Everyone in the team shares the same projects
- ✅ Everyone can add/edit projects and expenses
- ✅ Owner can see what members create
- ✅ Members can see what owner creates
- ✅ It's ONE shared workspace!

---

## 🐛 Troubleshooting

### Problem: "I don't see the Users tab"

**Solution:**
1. Make sure you're logged in as the owner account
2. Sub-users (members) don't see the Users tab
3. Run the migration if you haven't already
4. Restart app: `npx expo start --clear`

### Problem: "Can't add user - email already exists"

**Solution:**
- Each email can only be used once
- Try a different email address
- Or delete the existing user first

### Problem: "New user can't login"

**Solution:**
- Check the password is correct (case-sensitive)
- Make sure user status is "Active" ✅
- Check the password is at least 6 characters

### Problem: "New user sees empty projects"

**Solution:**
- This means RLS policies need updating
- Run the migration: `migrations/add_user_management.sql`
- This updates the database permissions

---

## 🎉 Success Checklist

- [ ] I can login to my app
- [ ] I see the "Users" tab (5th tab)
- [ ] I can tap the + button
- [ ] Form appears with Email, Password, Name fields
- [ ] I can create a new user
- [ ] New user appears in the list
- [ ] I can logout and login as new user
- [ ] New user sees my projects
- [ ] New user can add projects

**All checked?** 🎊 You're all set!

---

**Need more help?** Check `USER_MANAGEMENT_GUIDE.md` for complete documentation!
