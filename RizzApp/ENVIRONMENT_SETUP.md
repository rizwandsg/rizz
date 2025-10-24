# Environment Configuration Helper

## Quick Commands

### Check Current Environment
```bash
# Check which keys you're using
grep "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" .env
```

### Switch to Development (Current)
```env
# In .env file:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cmVndWxhci1nbnUtODcuY2xlcmsuYWNjb3VudHMuZGV2JA
```

### Switch to Production (When Ready)
```env
# In .env file:
# Comment out test key:
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Add production key:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```

### Clear Cache After Switching
```bash
npx expo start --clear
```

---

## Environment Validation

### ✅ Development Keys (Current)
- Key starts with `pk_test_`
- Warning appears (now suppressed)
- 500 MAU limit
- Perfect for testing

### 🚀 Production Keys (Future)
- Key starts with `pk_live_`
- No warning
- Unlimited MAUs
- For live app

---

## Key Features by Environment

| Feature | Development | Production |
|---------|------------|------------|
| User Limit | 500 MAUs | Unlimited |
| Email Verification | Optional | Required |
| OAuth Providers | Test mode | Production mode |
| Support | Community | Priority (paid plans) |
| Data Persistence | Development DB | Production DB |

---

## 🎯 Current Status

**Environment:** Development ✅  
**Warning:** Suppressed ✅  
**Action Required:** None (continue development)  
**Next Step:** Get production keys when ready to deploy

---

## 🔧 Troubleshooting

### Warning Still Appears?
1. Restart Metro bundler: `npx expo start --clear`
2. Check `app/_layout.tsx` has `LogBox.ignoreLogs()`
3. Verify using `pk_test_` key

### Ready for Production?
1. Follow steps in `CLERK_PRODUCTION_GUIDE.md`
2. Get `pk_live_` key from Clerk Dashboard
3. Update `.env` file
4. Clear cache and rebuild

---

**Quick Reference:**
- Development: `pk_test_` ← You are here
- Production: `pk_live_` ← Switch when deploying
