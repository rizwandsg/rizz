## 🗺️ RizzApp Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         RizzApp Entry                           │
│                    (ProtectedRoute Check)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Authenticated?      │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         │ NO                            │ YES
         ▼                               ▼
┌─────────────────┐           ┌─────────────────────┐
│   AUTH ROUTES   │           │    MAIN APP TABS    │
│   /(auth)/      │           │     /(tabs)/        │
└─────────────────┘           └─────────────────────┘
         │                               │
    ┌────┴────┐                  ┌──────┴──────┬──────────┬─────────┐
    ▼         ▼                  ▼             ▼          ▼         ▼
┌────────┐ ┌────────┐      ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Login  │ │ Signup │      │ Projects │ │ Expenses │ │Analytics │ │ Profile  │
│  Page  │ │  Page  │      │   Tab    │ │   Tab    │ │   Tab    │ │   Tab    │
└────────┘ └────────┘      └──────────┘ └──────────┘ └──────────┘ └──────────┘
    │         │                  │             │          │             │
    └────┬────┘                  │             │          │             │
         │                       │             │          │             │
         │ Login/Signup Success  │             │          │             │
         └───────────────────────┤             │          │             │
                                 │             │          │             │
                           ┌─────┴─────────────┴──────────┴─────────────┘
                           │
                    Tab Navigation
                  (Bottom Tab Bar)
                           │
         ┌─────────────────┼─────────────────┬─────────────────┐
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
   [Add Project]    [Project Details]  [Add Expense]      [Logout]
    Modal Screen     Detail Screen      Modal Screen        Action
         │                                    │                 │
         │                                    │                 │
         └────────────────┬───────────────────┘                 │
                          │                                     │
                    Back to Tabs                         Back to Login
```

---

## 📱 Tab Details

### 1️⃣ Projects Tab (home.tsx)
```
┌───────────────────────────────┐
│  🏗️ Projects Overview        │
│                          [+]  │
├───────────────────────────────┤
│                               │
│  📋 Project Table             │
│  ┌──────┬────────┬──────────┐│
│  │ Name │ Client │  Status  ││
│  ├──────┼────────┼──────────┤│
│  │ ...  │  ...   │  Active  ││
│  └──────┴────────┴──────────┘│
│                               │
│  [Tap to view details]        │
└───────────────────────────────┘
```

### 2️⃣ Expenses Tab (expense.tsx)
```
┌───────────────────────────────┐
│  💸 Expenses                  │
│                          [+]  │
├───────────────────────────────┤
│                               │
│  💳 Expense Cards             │
│  ┌─────────────────────────┐ │
│  │ 📁 Project Name         │ │
│  │ Description             │ │
│  │ ₹5,000          📅 Date │ │
│  └─────────────────────────┘ │
│                               │
└───────────────────────────────┘
```

### 3️⃣ Analytics Tab (analytics.tsx)
```
┌───────────────────────────────┐
│  📊 Financial Overview        │
├───────────────────────────────┤
│                               │
│  💰 Total Budget: ₹50,000     │
│  💸 Total Spent:  ₹32,000     │
│                               │
│  📊 Budget Distribution       │
│  [Pie Chart]                  │
│                               │
│  📈 Monthly Expenses          │
│  [Line Chart]                 │
│                               │
└───────────────────────────────┘
```

### 4️⃣ Profile Tab (profile.tsx) ⭐ NEW
```
┌───────────────────────────────┐
│         👤                    │
│     John Doe                  │
│  john@example.com             │
├───────────────────────────────┤
│                               │
│  📊 Your Stats                │
│  ┌────┬────────┬──────────┐  │
│  │ 5  │   12   │ ₹32,000  │  │
│  │Pro │ Exp    │  Total   │  │
│  └────┴────────┴──────────┘  │
│                               │
│  ⚙️ Account                   │
│  • Edit Profile           >   │
│  • Change Password        >   │
│  • Notifications          >   │
│                               │
│  🎨 App Settings              │
│  • Theme                  >   │
│  • Help & Support         >   │
│  • About                  >   │
│                               │
│  [🚪 Logout]                  │
│                               │
│  Version 1.0.0                │
└───────────────────────────────┘
```

---

## 🔄 Navigation Flows

### Flow 1: First Time User
```
1. Open App
   ↓
2. No auth → Redirect to Login
   ↓
3. Click "Sign Up"
   ↓
4. Fill form → Submit
   ↓
5. Success → Navigate to Projects Tab
   ↓
6. Bottom tabs visible (4 tabs)
```

### Flow 2: Returning User
```
1. Open App
   ↓
2. Auth exists → Navigate to Projects Tab
   ↓
3. Browse 4 tabs freely
```

### Flow 3: Logout
```
1. Navigate to Profile Tab
   ↓
2. Scroll to bottom
   ↓
3. Tap "Logout" button
   ↓
4. Confirm in alert
   ↓
5. Clear session → Redirect to Login
```

### Flow 4: Add Project/Expense
```
1. In Projects/Expenses Tab
   ↓
2. Tap [+] button (top right)
   ↓
3. Modal screen opens
   ↓
4. Fill form → Save
   ↓
5. Return to tab (updated list)
```

---

## 🎨 Visual Hierarchy

```
App Theme: Clean Light Mode

Colors:
- Primary:   #007AFF (iOS Blue)
- Success:   #34C759 (Green)  
- Warning:   #FF9500 (Orange)
- Danger:    #FF3B30 (Red)
- Background:#F8F9FA (Light Gray)
- Surface:   #FFFFFF (White)
- Text:      #1C1C1E (Almost Black)
- Secondary: #8E8E93 (Gray)

Typography:
- Headers:   24px Bold
- Body:      16px Regular
- Caption:   12px Regular

Spacing:
- Screen padding: 16px
- Card spacing:   12px
- Section gaps:   16px

Components:
- Card elevation: 2
- Border radius:  12px
- Tab bar height: 60px
```

---

## 📊 Data Flow

```
User Action → UI Component → API Call → Supabase
                ↓              ↓
           Loading State   Error Handling
                ↓              ↓
           Update UI ← Success Response
```

### Example: Login Flow
```typescript
// User enters credentials
↓
handleLogin() in login.tsx
↓
await login({ email, password }) from authApi.ts
↓
databaseService.loadData('users', filters)
↓
Supabase PostgreSQL Query
↓
Return user data
↓
Store in AsyncStorage
↓
router.replace('/(tabs)/home')
↓
Show Projects Tab
```

---

## 🔐 Protected Routes

```
All routes under /(tabs)/ require authentication

ProtectedRoute.tsx checks:
1. Is user authenticated?
2. Current route segment
3. Apply redirect logic:

   Not Auth + Not in (auth) → Redirect to Login
   Is Auth + In (auth)     → Redirect to Home Tab
   Is Auth + In (tabs)     → Allow Access ✅
```
