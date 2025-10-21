# 🚨 FIX: Database Schema Missing Columns

## Error Explained
Your app is trying to save `payment_method` and other new fields, but the database columns don't exist yet. You need to run the migration script.

---

## ✅ Solution - Follow These Steps:

### **Step 1: Open Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar

### **Step 2: Run the Migration Script**

1. In the SQL Editor, click **"New query"**
2. Open the file: `migrations/run_this_in_supabase.sql`
3. **Copy the ENTIRE contents** of that file
4. **Paste** into the Supabase SQL Editor
5. Click **"Run"** button (or press `Ctrl+Enter`)

### **Step 3: Verify Success**

You should see output like this:

```
✓ Added vendor_name column to expenses
✓ Added vendor_contact column to expenses
✓ Added payment_method column to expenses
✓ Added payment_status column to expenses
✓ Indexes created successfully
✓ expenses_by_vendor view created
✓ expenses_by_payment_method view created
✓ get_unique_vendors() function created

=== SCHEMA VERIFICATION ===

✓ vendor_name column exists
✓ vendor_contact column exists
✓ payment_method column exists
✓ payment_status column exists
✓ expenses_by_vendor view exists
✓ expenses_by_payment_method view exists

=== VERIFICATION COMPLETE ===

🎉 SUCCESS! All columns added successfully.
```

### **Step 4: Restart Your Expo App**

The app caches the database schema, so you need to restart it:

```bash
# In your terminal, press Ctrl+C to stop the app
# Then restart it:
npm start
```

Or simply:
1. Stop the Metro bundler
2. Close the app on your phone/emulator
3. Run `npm start` again
4. Reopen the app

### **Step 5: Test Creating Expense**

1. Open "Add Expense" screen
2. Fill in the form
3. Select vendor (optional)
4. Select payment method
5. Click "Save Expense"
6. ✅ Should work without errors!

---

## 🔍 If You Still Get Errors:

### Error: "Column already exists"
**Solution:** This is fine! It means some columns were already added. The script handles this gracefully.

### Error: "Permission denied"
**Solution:** Make sure you're logged into Supabase with proper admin rights.

### Error: Still says "column not found"
**Solution:** 
1. Check that the migration actually ran (look for success messages)
2. Hard restart your Expo app:
   ```bash
   npm start -- --reset-cache
   ```
3. Clear app data on your phone/emulator and reinstall

### Error: "Table 'expenses' does not exist"
**Solution:** Your database needs the basic tables first. Run the main schema creation scripts first, then this migration.

---

## 📋 Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Clicked SQL Editor
- [ ] Created New Query
- [ ] Copied entire `run_this_in_supabase.sql` file
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run" button
- [ ] Saw success messages
- [ ] Restarted Expo app (npm start)
- [ ] Closed and reopened app on phone
- [ ] Tested creating expense
- [ ] Error is gone! ✅

---

## 🆘 Need More Help?

If the error persists after following all steps:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs
   - Look for SQL errors

2. **Verify columns exist:**
   Run this in SQL Editor:
   ```sql
   SELECT column_name 
   FROM information_schema.columns
   WHERE table_name = 'expenses'
   ORDER BY column_name;
   ```
   
   Should show:
   - amount
   - category
   - created_at
   - description
   - expense_date
   - id
   - **payment_method** ← NEW
   - **payment_status** ← NEW
   - project_id
   - scope_of_work
   - updated_at
   - user_id
   - **vendor_contact** ← NEW
   - **vendor_name** ← NEW

3. **Hard reset everything:**
   ```bash
   # Kill Expo server
   Ctrl+C
   
   # Clear cache
   npm start -- --reset-cache
   
   # If needed, clear node modules
   rm -rf node_modules
   npm install
   npm start
   ```

---

## ✅ After Fix is Applied

Once migration is successful and app is restarted, you'll be able to:

- ✅ Create expenses with vendor info
- ✅ Select payment methods (Cash, UPI, Bank, etc.)
- ✅ Set payment status (Paid/Unpaid/Partial)
- ✅ View vendor history in dropdown
- ✅ See payment info in expense details

---

**The migration script is safe to run multiple times** - it checks if columns exist before adding them.
