# 👥 USER MANAGEMENT SYSTEM - Complete Guide

## 🎯 Overview

Your app now has **team collaboration features**! Owner accounts can create sub-users (team members) who can:
- Login with their own credentials
- Access and manage the same projects/expenses
- Be enabled/disabled by the owner
- Have their passwords reset by the owner

## 📋 What's Changed

### 1. Database Schema Updates
Added 3 new columns to the `users` table:
- `parent_user_id` (UUID) - Links sub-users to their owner
- `role` (VARCHAR) - Either 'owner' or 'member'
- `is_active` (BOOLEAN) - Control if user can login

### 2. New UI Features
- **New "Users" Tab** - Only visible to owner accounts
- Create, edit, delete, and manage team members
- Reset passwords for sub-users
- Enable/disable sub-users instantly
- See team statistics (total, active, inactive)

### 3. Enhanced Security
- RLS policies updated so sub-users can access parent's data
- Parents can see all sub-user activities
- Sub-users cannot create other sub-users
- Inactive sub-users cannot login

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Open Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT/sql
2. Copy and paste the entire contents of:
   ```
   migrations/add_user_management.sql
   ```
3. Click "Run" and wait for success messages
4. You should see:
   ```
   ✓ New columns added successfully
   ✓ RLS policies updated successfully
   ✓ Helper views created
   MIGRATION COMPLETE! ✅
   ```

### Step 2: Restart Your Expo App

```powershell
# Stop the current server (Ctrl+C)

# Clear cache and restart
npx expo start --clear
```

### Step 3: Test the Features

1. **Login as existing user** (will be automatically set as 'owner')
2. **See new "Users" tab** in bottom navigation
3. **Add a team member**:
   - Tap Users tab
   - Tap the blue + button
   - Fill in: Email, Password, Full Name, Phone (optional)
   - Tap "Create"
4. **Test sub-user login**:
   - Logout
   - Login with sub-user credentials
   - Notice: No "Users" tab (members can't manage users)
   - But can see all projects/expenses from parent

## 📱 Features Breakdown

### For Owner Accounts

**Users Tab Features:**
- ➕ Add new team members
- ✏️ Edit member details
- 🔄 Reset member passwords (generates 6-digit temp password)
- ⏸️ Disable/Enable members
- 🗑️ Delete members
- 📊 View team statistics

**What Owners See:**
- All 5 tabs: Projects, Expenses, Analytics, Users, Profile
- All data from themselves and their sub-users
- Can manage team members

### For Member Accounts (Sub-users)

**What Members See:**
- 4 tabs: Projects, Expenses, Analytics, Profile (no Users tab)
- All data from their parent owner
- Can create/edit/delete projects and expenses
- Cannot create other users
- Can change their own profile

## 🔒 How It Works

### Data Sharing Model

```
Owner Account (rizwankottiligal@gmail.com)
├── Projects created by owner
├── Expenses by owner
└── Sub-users:
    ├── Member 1 (john@example.com)
    │   ├── Can see owner's projects
    │   ├── Can create projects (owner sees them)
    │   └── Can add expenses (owner sees them)
    └── Member 2 (sarah@example.com)
        ├── Can see owner's projects
        ├── Can see Member 1's projects
        └── Everyone's data is shared
```

### Role-Based Access

| Feature | Owner | Member |
|---------|-------|--------|
| View Projects | ✅ All | ✅ All |
| Create Projects | ✅ | ✅ |
| View Expenses | ✅ All | ✅ All |
| Add Expenses | ✅ | ✅ |
| Manage Users | ✅ | ❌ |
| See Users Tab | ✅ | ❌ |

### Account Status

- **Active Members**: Can login and work normally
- **Inactive Members**: Cannot login (credentials rejected)
- Owner can toggle status instantly

## 🎨 UI Guide

### Users Screen Layout

```
┌─────────────────────────────┐
│  Team Members          [+]  │ ← Header with Add button
├─────────────────────────────┤
│ Total: 5  Active: 4  Inac:1│ ← Statistics
├─────────────────────────────┤
│ [👤] John Doe              │
│      john@example.com       │
│      📱 +1234567890         │
│      Status: Active         │
│ [Edit][Reset][Disable][Del] │ ← Actions
├─────────────────────────────┤
│ [👤] Sarah Smith           │
│      sarah@example.com      │
│      Status: Inactive       │
│ [Edit][Reset][Enable][Del]  │
└─────────────────────────────┘
```

### Add/Edit User Modal

**For New User:**
- Email (required)
- Password (required, min 6 chars)
- Full Name (required)
- Phone (optional)

**For Existing User:**
- Full Name (editable)
- Phone (editable)
- Active Status (toggle)
- Email & Password (cannot change)

## 💻 API Functions

### Available Functions in `authApi.ts`

```typescript
// Create a new team member
createSubUser(data: CreateSubUserData): Promise<SubUser>

// Get all team members
getSubUsers(): Promise<SubUser[]>

// Update member details
updateSubUser(subUserId: string, data: {
    full_name?: string;
    phone?: string;
    is_active?: boolean;
}): Promise<SubUser>

// Delete a team member
deleteSubUser(subUserId: string): Promise<void>

// Reset member password (returns temp password)
resetSubUserPassword(subUserId: string): Promise<string>
```

### Usage Examples

```typescript
// Create a new member
const newMember = await createSubUser({
    email: 'john@example.com',
    password: 'securepass123',
    full_name: 'John Doe',
    phone: '+1234567890'
});

// Get all members
const members = await getSubUsers();

// Disable a member
await updateSubUser(memberId, { is_active: false });

// Reset password
const tempPassword = await resetSubUserPassword(memberId);
Alert.alert('New Password', tempPassword);
```

## 🔍 Testing Checklist

### Database Migration
- [ ] Migration runs without errors
- [ ] New columns exist in users table
- [ ] RLS policies show "accessible" in names
- [ ] Helper views created (users_with_parent, user_team_summary)

### Owner Account
- [ ] Login shows 5 tabs (including Users)
- [ ] Can add new team member
- [ ] Can see all members in list
- [ ] Can edit member details
- [ ] Can reset member password
- [ ] Can disable/enable member
- [ ] Can delete member
- [ ] Statistics show correct counts

### Member Account
- [ ] New member can login with credentials
- [ ] Shows only 4 tabs (no Users tab)
- [ ] Can see all projects from owner
- [ ] Can create new projects (owner sees them)
- [ ] Can add expenses
- [ ] Can edit own profile
- [ ] Cannot access Users screen

### Inactive Member
- [ ] Cannot login (gets "Invalid email or password")
- [ ] Owner can re-enable and then login works

## 🐛 Troubleshooting

### Error: "Column does not exist"
**Solution**: Migration didn't run. Go to Supabase SQL Editor and run `migrations/add_user_management.sql`

### Error: "Users tab not showing"
**Solution**: 
- Check if user has `role: 'owner'` in profile
- Clear app cache: `npx expo start --clear`
- Logout and login again

### Error: "Sub-user can't login"
**Solution**:
- Check if member is marked as `is_active: true`
- Verify password is correct (case-sensitive)
- Try resetting password from owner account

### Sub-user sees empty data
**Solution**:
- Check RLS policies are updated (should have "accessible" in names)
- Verify parent_user_id is correctly set
- Re-run migration if needed

## 📊 Database Views

Two helper views are created:

### 1. users_with_parent
Shows all users with their parent info:
```sql
SELECT * FROM users_with_parent;
```

### 2. user_team_summary
Shows team statistics per owner:
```sql
SELECT * FROM user_team_summary;
```

## 🚨 Important Notes

1. **Existing Users**: All existing users are automatically set as 'owner' role
2. **New Signups**: Anyone who signs up gets 'owner' role (independent account)
3. **Sub-users**: Can only be created through the Users tab
4. **Data Sharing**: All data is shared within the team (owner + all members)
5. **Deletion**: Deleting a member also deletes their created projects/expenses
6. **Cascade Delete**: When owner is deleted, all sub-users are also deleted

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Migration shows all checkmarks
- ✅ Users tab appears for owners
- ✅ Can create and see team members
- ✅ Sub-users can login and see shared data
- ✅ Password reset generates 6-digit codes
- ✅ Disable/enable works instantly
- ✅ Statistics update correctly

## 📝 Next Steps

After setup, you can:
1. **Add your team members** through the Users tab
2. **Share login credentials** securely
3. **Monitor team activity** through last login times
4. **Manage access** by enabling/disabling users
5. **Reset passwords** when users forget

---

**Status**: ✅ Implementation Complete
**Date**: October 22, 2025
**Version**: 2.0.0

Need help? Check the terminal logs for detailed error messages! 🚀
