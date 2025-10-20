# Authentication Pages Documentation

## 📁 File Structure

```
app/
├── (auth)/
│   ├── _layout.tsx       # Auth layout wrapper
│   ├── login.tsx         # Login page
│   └── signup.tsx        # Signup page
├── _layout.tsx           # Root layout with ProtectedRoute
└── index.tsx             # Dashboard (protected)

components/
└── ProtectedRoute.tsx    # Authentication guard
```

## 🎨 Pages Created

### 1. Login Page (`app/(auth)/login.tsx`)

**Features:**
- Email and password input fields
- Form validation
- Loading states
- Error handling with alerts
- Navigation to signup page
- Auto-redirect to dashboard on success

**Validation:**
- Email format validation
- Required field checks
- User-friendly error messages

**Usage:**
```typescript
// Users can access via: /(auth)/login
// Or will be redirected here if not authenticated
```

### 2. Signup Page (`app/(auth)/signup.tsx`)

**Features:**
- Full name, email, password, and confirm password fields
- Comprehensive validation
- Password strength requirement (min 6 characters)
- Password matching validation
- Loading states
- Error handling with alerts
- Navigation to login page
- Auto-redirect to dashboard on success

**Validation:**
- Full name required
- Email format validation
- Password minimum length (6 characters)
- Password confirmation match
- Duplicate email check (handled by Supabase)

**Usage:**
```typescript
// Users can access via: /(auth)/signup
```

### 3. Dashboard (`app/index.tsx`)

**Features:**
- User greeting with name
- Logout button
- Statistics cards (projects, expenses, total)
- Quick action buttons
- Recent projects list
- Recent expenses list
- Empty state for new users

**Protected:**
- Only accessible when authenticated
- Auto-redirects to login if not authenticated

## 🔐 Authentication Flow

### Initial App Load

```
1. App starts
2. ProtectedRoute checks authentication
3. If authenticated → Show Dashboard
4. If not authenticated → Redirect to Login
```

### Signup Flow

```
1. User navigates to /(auth)/signup
2. Fills in form (name, email, password, confirm password)
3. Validates all inputs
4. Calls signup() API with SHA-256 hashed password
5. User data saved to Supabase users table
6. Session token saved to AsyncStorage
7. Auto-redirect to Dashboard
8. Success alert displayed
```

### Login Flow

```
1. User navigates to /(auth)/login
2. Enters email and password
3. Validates inputs
4. Calls login() API with credentials
5. Password hashed and compared with database
6. On success:
   - User data retrieved
   - Session token saved
   - last_login updated in database
   - Auto-redirect to Dashboard
7. On failure:
   - Error alert shown
   - User stays on login page
```

### Logout Flow

```
1. User clicks "Logout" button on Dashboard
2. Confirmation alert shown
3. If confirmed:
   - logout() API called
   - Session cleared from AsyncStorage
   - Redirect to Login page
```

## 🎯 Route Protection

The `ProtectedRoute` component handles all authentication checks:

```typescript
// Checks on every route change
if (!authenticated && !inAuthPages) {
  // Redirect to login
}

if (authenticated && inAuthPages) {
  // Redirect to dashboard (prevent going back to login when logged in)
}
```

## 🎨 UI/UX Features

### Design Elements
- Clean, modern interface
- Card-based layouts
- Consistent color scheme (#007AFF primary)
- Shadow effects for depth
- Responsive form elements
- Loading indicators
- Keyboard-aware scrolling

### User Feedback
- Loading spinners during operations
- Success alerts on completion
- Error alerts with descriptive messages
- Visual validation states
- Disabled states during loading

## 📱 Mobile Optimization

- Keyboard-avoiding views
- Scroll views for small screens
- Touch-optimized button sizes
- Auto-capitalization controls
- Secure text entry for passwords
- Autocomplete hints

## 🔒 Security Features

### Password Security
- SHA-256 hashing before storage
- Never stored in plain text
- Secure text entry (hidden input)
- Minimum length requirement

### Session Management
- Token stored in AsyncStorage
- Automatic expiration handling
- Secure session checks
- Clean logout process

### Input Validation
- Email format validation
- Required field checks
- Password strength requirements
- XSS prevention through proper escaping

## 📊 Dashboard Features

### User Stats
- Total projects count
- Total expenses count
- Sum of all expenses
- Real-time updates

### Quick Actions
- Add New Project button
- Add Expense button
- Easy navigation

### Recent Activity
- Last 3 projects displayed
- Last 5 expenses displayed
- Date formatting
- Status badges

## 🧪 Testing the Flow

### Test Signup

```bash
1. Open app
2. Click "Sign Up" link
3. Enter:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
   - Confirm: "test123"
4. Click "Sign Up"
5. Verify redirect to dashboard
6. Check user name appears
```

### Test Login

```bash
1. Logout from dashboard
2. On login page, enter:
   - Email: "test@example.com"
   - Password: "test123"
3. Click "Sign In"
4. Verify redirect to dashboard
```

### Test Validation

```bash
# Login Page
1. Try empty email → Error
2. Try invalid email → Error
3. Try empty password → Error

# Signup Page
1. Try empty name → Error
2. Try invalid email → Error
3. Try password < 6 chars → Error
4. Try non-matching passwords → Error
```

## 🚨 Error Handling

All pages handle these errors:

1. **Network Errors**: Caught and displayed to user
2. **Validation Errors**: Shown before API calls
3. **Authentication Errors**: Clear error messages
4. **Duplicate Email**: Handled by Supabase
5. **Session Expiry**: Auto-redirect to login

## 🎨 Customization

### Colors
Change the primary color in all files:
```typescript
// Current: #007AFF (iOS Blue)
backgroundColor: '#007AFF'
color: '#007AFF'

// Replace with your brand color
```

### Text
Update welcome messages in:
- `app/(auth)/login.tsx` → "Welcome Back"
- `app/(auth)/signup.tsx` → "Create Account"
- `app/index.tsx` → "Welcome back,"

### Validation Rules
Modify in respective files:
- Minimum password length
- Email format requirements
- Name requirements

## 📝 Next Steps

1. **Add "Forgot Password"** functionality
2. **Implement email verification**
3. **Add profile editing**
4. **Add social login** (Google, Apple)
5. **Add biometric authentication**
6. **Implement refresh tokens**
7. **Add session timeout**

## 🐛 Troubleshooting

### Issue: "User not authenticated" after signup
**Solution**: Check if AsyncStorage is working properly

### Issue: Can't login after signup
**Solution**: Verify password hashing is consistent

### Issue: Stuck on loading screen
**Solution**: Check Supabase connection and credentials

### Issue: Validation not working
**Solution**: Check form state and validation logic

## 💡 Best Practices

1. **Always validate on client side** before API calls
2. **Show loading states** during async operations
3. **Provide clear error messages** to users
4. **Handle edge cases** (network errors, etc.)
5. **Test on both iOS and Android**
6. **Use proper keyboard types** for inputs
7. **Implement proper session management**

---

**Status**: ✅ Ready to Use
**Date**: October 20, 2025
**Pages**: Login, Signup, Dashboard
**Authentication**: Custom (Supabase users table)