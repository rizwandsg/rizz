# Payment Tracking System - Implementation Guide

## 📋 Overview

This payment tracking system provides complete financial management for construction/interior design projects with two payment types:

1. **Customer Payments** (Money IN) - Track partial/full payments received from clients
2. **Vendor Payments** (Money OUT) - Track payments made to vendors/suppliers for expenses

---

## 🗄️ Database Schema

### Tables Created

#### 1. `customer_payments`
Tracks money received from customers for projects.

**Columns:**
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key → projects)
- `user_id` (UUID, Foreign Key → users)
- `amount` (NUMERIC(15,2), NOT NULL)
- `payment_date` (DATE, Default: CURRENT_DATE)
- `payment_method` (VARCHAR(50), Default: 'Cash')
- `reference_number` (VARCHAR(100), Optional)
- `notes` (TEXT, Optional)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- idx_customer_payments_project (project_id)
- idx_customer_payments_date (payment_date)
- idx_customer_payments_user (user_id)

#### 2. `vendor_payments`
Tracks money paid to vendors/suppliers for expenses.

**Columns:**
- `id` (UUID, Primary Key)
- `expense_id` (UUID, Foreign Key → expenses)
- `project_id` (UUID, Foreign Key → projects)
- `user_id` (UUID, Foreign Key → users)
- `amount` (NUMERIC(15,2), NOT NULL)
- `payment_date` (DATE, Default: CURRENT_DATE)
- `payment_method` (VARCHAR(50), Default: 'Cash')
- `vendor_name` (VARCHAR(255), NOT NULL)
- `vendor_contact` (VARCHAR(50), Optional)
- `reference_number` (VARCHAR(100), Optional)
- `notes` (TEXT, Optional)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- idx_vendor_payments_expense (expense_id)
- idx_vendor_payments_project (project_id)
- idx_vendor_payments_date (payment_date)
- idx_vendor_payments_user (user_id)

### Database Views

#### 1. `project_payment_summary`
Comprehensive financial summary for each project.

**Returns:**
- `project_id`, `project_name`, `client_name`, `total_project_cost`
- `total_received` - Total money received from customer
- `total_expenses` - Total expenses recorded
- `total_paid_to_vendors` - Total money paid to vendors
- `outstanding_from_customer` - Money still owed by customer
- `outstanding_to_vendors` - Money still owed to vendors
- `payment_status` - 'Not Set' | 'Unpaid' | 'Partial' | 'Paid'
- `payment_progress_percentage` - % of project cost received

**Usage:**
```sql
SELECT * FROM project_payment_summary WHERE project_id = 'xxx';
```

#### 2. `expense_payment_status`
Payment status for each expense.

**Returns:**
- `expense_id`, `project_id`, `expense_description`, `expense_amount`
- `category`, `scope_of_work`, `expense_date`
- `total_paid` - Total paid to vendors for this expense
- `outstanding_amount` - Amount still unpaid
- `payment_status` - 'Unpaid' | 'Partial' | 'Paid'
- `payment_progress_percentage` - % of expense paid
- `payment_count` - Number of payments made

**Usage:**
```sql
SELECT * FROM expense_payment_status WHERE expense_id = 'xxx';
```

#### 3. `payment_timeline`
Chronological view of all payments (customer + vendor).

**Returns:**
- `id`, `project_id`, `payment_type` ('Customer Payment' | 'Vendor Payment')
- `amount`, `payment_date`, `payment_method`
- `reference_number`, `notes`
- `vendor_name` (only for vendor payments)
- `expense_id` (only for vendor payments)

**Usage:**
```sql
SELECT * FROM payment_timeline 
WHERE project_id = 'xxx' 
ORDER BY payment_date DESC;
```

---

## 🔐 Row Level Security (RLS)

Both tables have RLS enabled with policies:
- Users can only view/insert/update/delete their own payments
- All operations filtered by `auth.uid() = user_id`

---

## 💻 API Implementation

### Customer Payments API (`api/customerPaymentsApi.ts`)

#### Types
```typescript
type PaymentMethod = 'Cash' | 'Check' | 'Bank Transfer' | 'UPI' | 'Card' | 'Other';

interface CustomerPayment {
  id?: string;
  project_id: string;
  user_id?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
```

#### Functions

**`createCustomerPayment(payment: CustomerPayment)`**
- Records a new customer payment
- Auto-assigns user_id
- Returns: Created payment object

**`getCustomerPaymentsByProject(projectId: string)`**
- Gets all payments for a project
- Sorted by payment_date DESC
- Returns: CustomerPayment[]

**`getCustomerPaymentById(id: string)`**
- Gets single payment
- Verifies ownership
- Returns: CustomerPayment | null

**`updateCustomerPayment(id: string, payment: Partial<CustomerPayment>)`**
- Updates existing payment
- Verifies ownership
- Returns: Updated payment

**`deleteCustomerPayment(id: string)`**
- Deletes payment
- Verifies ownership
- Returns: void

**`getProjectPaymentSummary(projectId: string)`**
- Gets comprehensive payment summary from view
- Returns: ProjectPaymentSummary | null

**`calculateTotalReceived(projectId: string)`**
- Sums all payments for project
- Returns: number

**`PAYMENT_METHODS`**
- Array of payment method options with icons
- Use for UI dropdowns

### Vendor Payments API (`api/vendorPaymentsApi.ts`)

#### Types
```typescript
interface VendorPayment {
  id?: string;
  expense_id: string;
  project_id: string;
  user_id?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  vendor_name: string;
  vendor_contact?: string;
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
```

#### Functions

**`createVendorPayment(payment: VendorPayment)`**
- Records payment to vendor
- Must link to expense_id
- Returns: Created payment

**`getVendorPaymentsByExpense(expenseId: string)`**
- Gets all payments for an expense
- Returns: VendorPayment[]

**`getVendorPaymentsByProject(projectId: string)`**
- Gets all vendor payments for project
- Returns: VendorPayment[]

**`getVendorPaymentById(id: string)`**
- Gets single vendor payment
- Returns: VendorPayment | null

**`updateVendorPayment(id: string, payment: Partial<VendorPayment>)`**
- Updates existing vendor payment
- Returns: Updated payment

**`deleteVendorPayment(id: string)`**
- Deletes vendor payment
- Returns: void

**`getExpensePaymentStatus(expenseId: string)`**
- Gets payment status from view
- Returns: ExpensePaymentStatus | null

**`calculateTotalPaid(expenseId: string)`**
- Sums all vendor payments for expense
- Returns: number

---

## 🎨 UI Screens

### AddCustomerPayment Screen (`app/AddCustomerPayment.tsx`)

**Purpose:** Record/edit customer payments

**Features:**
- Project info display (name, client, total cost)
- Amount input with currency symbol (₹)
- Payment date picker
- Payment method dropdown (Cash, Check, UPI, etc.)
- Reference number field (check #, transaction ID)
- Notes field
- Validation and error handling

**Usage:**
```typescript
// Create new payment
router.push(`/AddCustomerPayment?projectId=${projectId}`);

// Edit existing payment
router.push(`/AddCustomerPayment?projectId=${projectId}&id=${paymentId}`);
```

**Validation:**
- Amount must be positive number
- Payment date cannot be in future
- Project must exist

### AddVendorPayment Screen (To be created)

**Purpose:** Record/edit vendor payments

**Features:**
- Expense selection (filtered by project)
- Vendor name and contact
- Amount input (cannot exceed remaining expense balance)
- Payment method dropdown
- Reference number
- Notes field

**Recommended Implementation:**
```typescript
// In ExpenseDetails.tsx, add "Record Payment" button
<TouchableOpacity 
  onPress={() => router.push(`/AddVendorPayment?expenseId=${expense.id}&projectId=${expense.project_id}`)}
>
  <Text>Record Payment</Text>
</TouchableOpacity>
```

---

## 📊 Integration with ProjectDetails

### Recommended Enhancements

#### 1. Payment Summary Card
```typescript
const [paymentSummary, setPaymentSummary] = useState<ProjectPaymentSummary | null>(null);

useEffect(() => {
  const loadSummary = async () => {
    const summary = await getProjectPaymentSummary(project.id);
    setPaymentSummary(summary);
  };
  loadSummary();
}, [project.id]);

// Display:
// - Total Project Cost: ₹500,000
// - Total Received: ₹300,000 (60%)
// - Outstanding: ₹200,000
// - Total Expenses: ₹250,000
// - Paid to Vendors: ₹150,000 (60%)
// - Outstanding to Vendors: ₹100,000
// - Payment Status Badge: Partial (color-coded)
```

#### 2. Customer Payments List
```typescript
const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);

// Display as cards with:
// - Amount, Date, Method
// - Reference number
// - Edit/Delete buttons
```

#### 3. Vendor Payments by Expense
```typescript
// In expense grouping, show payment status
{expenses.map(expense => {
  const status = await getExpensePaymentStatus(expense.id);
  return (
    <ExpenseCard 
      expense={expense}
      paymentStatus={status.payment_status}
      paidAmount={status.total_paid}
      outstanding={status.outstanding_amount}
    />
  );
})}
```

#### 4. Payment Progress Bars
```tsx
{/* Customer Payment Progress */}
<View style={styles.progressContainer}>
  <View style={styles.progressBar}>
    <View 
      style={[
        styles.progressFill, 
        { width: `${paymentSummary.payment_progress_percentage}%` }
      ]} 
    />
  </View>
  <Text>{paymentSummary.payment_progress_percentage}% received</Text>
</View>

{/* Vendor Payment Progress */}
<View style={styles.progressContainer}>
  <View style={styles.progressBar}>
    <View 
      style={[
        styles.progressFill, 
        { width: `${expenseStatus.payment_progress_percentage}%` }
      ]} 
    />
  </View>
  <Text>{expenseStatus.payment_progress_percentage}% paid</Text>
</View>
```

---

## 🚀 Implementation Steps

### Step 1: Run Database Migration
```bash
# In Supabase SQL Editor, run:
migrations/add_payment_tracking.sql
```

### Step 2: Test Database Schema
```sql
-- Verify tables
SELECT * FROM customer_payments LIMIT 1;
SELECT * FROM vendor_payments LIMIT 1;

-- Test views
SELECT * FROM project_payment_summary;
SELECT * FROM expense_payment_status;
SELECT * FROM payment_timeline;
```

### Step 3: Import APIs in Screens
```typescript
import { 
  createCustomerPayment, 
  getCustomerPaymentsByProject,
  getProjectPaymentSummary,
  CustomerPayment 
} from '../api/customerPaymentsApi';

import {
  createVendorPayment,
  getVendorPaymentsByExpense,
  getExpensePaymentStatus,
  VendorPayment
} from '../api/vendorPaymentsApi';
```

### Step 4: Update ProjectDetails.tsx
```typescript
// Add payment summary section
const [paymentSummary, setPaymentSummary] = useState(null);
const [customerPayments, setCustomerPayments] = useState([]);

// Load in useEffect
useFocusEffect(
  useCallback(() => {
    const loadData = async () => {
      // ... existing code ...
      const summary = await getProjectPaymentSummary(id);
      setPaymentSummary(summary);
      
      const payments = await getCustomerPaymentsByProject(id);
      setCustomerPayments(payments);
    };
    loadData();
  }, [id])
);

// Add "Record Payment" button
<TouchableOpacity onPress={() => router.push(`/AddCustomerPayment?projectId=${id}`)}>
  <Text>+ Record Payment</Text>
</TouchableOpacity>
```

### Step 5: Update ExpenseDetails.tsx
```typescript
// Add vendor payment section
const [vendorPayments, setVendorPayments] = useState([]);
const [paymentStatus, setPaymentStatus] = useState(null);

// Load payments
useEffect(() => {
  const loadPayments = async () => {
    const payments = await getVendorPaymentsByExpense(expense.id);
    setVendorPayments(payments);
    
    const status = await getExpensePaymentStatus(expense.id);
    setPaymentStatus(status);
  };
  loadPayments();
}, [expense.id]);

// Add "Pay Vendor" button
<TouchableOpacity onPress={() => router.push(`/AddVendorPayment?expenseId=${expense.id}&projectId=${expense.project_id}`)}>
  <Text>Pay Vendor</Text>
</TouchableOpacity>
```

### Step 6: Create AddVendorPayment.tsx
```typescript
// Similar structure to AddCustomerPayment.tsx
// Additional fields:
// - Expense dropdown (pre-selected if from ExpenseDetails)
// - Vendor name (required)
// - Vendor contact
// - Validation: amount <= expense.amount - total_paid
```

### Step 7: Add Payment Status Badges
```typescript
const getStatusColor = (status: string) => {
  switch(status) {
    case 'Paid': return '#27ae60';
    case 'Partial': return '#f39c12';
    case 'Unpaid': return '#e74c3c';
    default: return '#95a5a6';
  }
};

<View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
  <Text style={styles.statusText}>{status}</Text>
</View>
```

---

## 📱 User Flows

### Flow 1: Record Customer Payment
1. User opens ProjectDetails
2. Clicks "Record Payment" button
3. Enters amount, date, method, reference
4. Saves payment
5. ProjectDetails refreshes showing updated totals

### Flow 2: Pay Vendor for Expense
1. User opens ExpenseDetails
2. Clicks "Pay Vendor" button
3. Enters vendor name, amount (≤ outstanding), date, method
4. Saves payment
5. ExpenseDetails shows payment status updated

### Flow 3: View Financial Summary
1. User opens ProjectDetails
2. Views payment summary card:
   - Total received vs project cost
   - Outstanding from customer
   - Total expenses vs payments made
   - Outstanding to vendors
3. Sees payment status badges on expenses

---

## ⚠️ Important Notes

### Payment Validation
- Customer payments are not limited (clients can overpay)
- Vendor payments should not exceed expense amount
- Use `getExpensePaymentStatus` to check remaining balance

### Outstanding Calculations
```typescript
// Customer Outstanding
const outstanding = project.total_project_cost - totalReceived;

// Vendor Outstanding per Expense
const outstanding = expense.amount - totalPaid;

// Total Vendor Outstanding for Project
const outstanding = totalExpenses - totalPaidToVendors;
```

### Multi-Currency Support (Future)
- Currently uses ₹ (Indian Rupee)
- To support multiple currencies:
  - Add `currency` column to projects
  - Update all amount displays
  - Convert in views/calculations

### Partial Payments
- System supports unlimited partial payments
- Each payment is tracked separately
- Totals calculated in views
- Progress percentages auto-calculated

---

## 🧪 Testing Checklist

- [ ] Run migration script successfully
- [ ] Verify tables and views created
- [ ] Test RLS policies (can't access other users' payments)
- [ ] Create customer payment via UI
- [ ] Edit customer payment
- [ ] Delete customer payment
- [ ] View payment summary in ProjectDetails
- [ ] Create vendor payment for expense
- [ ] Verify expense payment status updates
- [ ] Test payment method dropdown
- [ ] Test date picker (no future dates)
- [ ] Test amount validation (positive numbers only)
- [ ] Test auto-refresh after payment creation
- [ ] Test payment timeline view

---

## 🎯 Next Steps

1. ✅ Database migration completed
2. ✅ Customer payments API completed
3. ✅ Vendor payments API completed
4. ✅ AddCustomerPayment screen completed
5. ⏳ Create AddVendorPayment screen
6. ⏳ Update ProjectDetails with payment summary
7. ⏳ Update ExpenseDetails with vendor payments
8. ⏳ Add payment status badges
9. ⏳ Add payment history timeline
10. ⏳ Add payment analytics/reports

---

## 📞 Support

If you encounter issues:
1. Check console logs for error messages
2. Verify RLS policies in Supabase dashboard
3. Test database views directly in SQL editor
4. Ensure user is authenticated before API calls

**Common Issues:**
- "User not authenticated" → Check auth state
- "Unauthorized access" → Verify user_id matches
- Views returning empty → Check project_id filter
- Amount validation fails → Use parseFloat() for strings
