# 🚀 QUICK START - User Management System

## ⚡ 3-Step Setup

### 1️⃣ Run Migration (2 minutes)

1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy & paste: `migrations/add_user_management.sql`
3. Click **RUN**
4. Wait for: `✅ MIGRATION COMPLETE!`

### 2️⃣ Restart App (30 seconds)

```powershell
# Stop server (Ctrl+C), then:
npx expo start --clear
```

### 3️⃣ Test It! (1 minute)

1. Login to your app
2. See new **"Users"** tab 👥
3. Tap + button
4. Add team member:
   - Email: `test@example.com`
   - Password: `test123`
   - Name: `Test User`
5. Logout & login as test user
6. ✅ They see all your projects!

---

## 📁 Files Changed

| File | What Changed |
|------|--------------|
| `migrations/add_user_management.sql` | **NEW** - Database migration |
| `api/authApi.ts` | Added 5 sub-user functions |
| `app/(tabs)/users.tsx` | **NEW** - Users management screen |
| `app/(tabs)/_layout.tsx` | Added Users tab (owner-only) |
| `USER_MANAGEMENT_GUIDE.md` | **NEW** - Full documentation |

---

## ✅ What You Get

### Owner Accounts Can:
- ✅ Create team members
- ✅ Edit member details
- ✅ Reset member passwords
- ✅ Enable/Disable members
- ✅ Delete members
- ✅ See all team activity

### Team Members Can:
- ✅ Login with own credentials
- ✅ See all projects/expenses
- ✅ Create projects & expenses
- ✅ Edit own profile
- ❌ Cannot manage other users

---

## 🎯 Key Features

```
OWNER CREATES MEMBER
       ↓
MEMBER LOGINS
       ↓
MEMBER SEES OWNER'S DATA
       ↓
MEMBER ADDS PROJECT
       ↓
OWNER SEES MEMBER'S PROJECT
       ↓
✅ EVERYONE SHARES SAME DATA!
```

---

## 🔥 Quick Actions

### Add First Member
```
Users Tab → + Button → Fill Form → Create
```

### Reset Password
```
Users Tab → Member Card → Reset Button → Copy Password
```

### Disable Member
```
Users Tab → Member Card → Disable Button
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| No Users tab | Run migration, restart app |
| Can't add user | Check you're logged in as owner |
| Sub-user can't login | Check if active (green status) |
| Empty projects for member | Re-run migration (RLS issue) |

---

## 📞 Need Help?

1. Check `USER_MANAGEMENT_GUIDE.md` for full details
2. Look at terminal logs for errors
3. Verify migration completed successfully

---

**Ready?** Just run the migration and restart! 🚀
