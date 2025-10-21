# Categorized Scope of Work with Expense Tracking - Implementation Plan

## 🎯 Overview
Complete redesign of scope of work system with:
1. **12 Categories** organizing 41 work types
2. **"Other" option** for custom work types
3. **Expense linking** to specific scopes
4. **Context-aware expense categories** per scope

---

## 📊 Scope of Work Categories (12 Categories, 41+ Work Types)

### 1. **Carpentry & Woodwork** 🔨 (Brown #8B4513)
   - Carpentry Work
   - Furniture Work
   - Wardrobe Work
   - Wood Flooring
   - Door & Window Work
   - Staircase Work

### 2. **Painting & Finishes** 🎨 (Red #FF6B6B)
   - Painting Work
   - Wallpaper Work
   - Wall Cladding
   - Plastering Work
   - Plaster of Paris Work

### 3. **Metalwork** 🔧 (Steel Gray #546E7A)
   - Aluminium Work
   - Steel Fabrication
   - Railing Work

### 4. **Civil & Structural** 🏗️ (Dark Gray #34495E)
   - Structural Work
   - Civil Work
   - Masonry Work
   - Demolition Work
   - Site Preparation

### 5. **Flooring & Tiling** 📐 (Teal #16A085)
   - Flooring Work
   - Tiling Work
   - Marble & Granite Work

### 6. **Electrical & Lighting** ⚡ (Orange #F39C12)
   - Electrical Work
   - Lighting Work

### 7. **Plumbing & Sanitary** 🔧 (Blue #3498DB)
   - Plumbing Work
   - Bathroom Fitting
   - Waterproofing Work

### 8. **Ceiling & Partition** 💡 (Purple #9B59B6)
   - False Ceiling Work
   - Partition Work
   - Glazing Work

### 9. **Interior & Decor** 🛋️ (Pink #E91E63)
   - Interior Decoration
   - Kitchen & Modular Work
   - Curtain & Blinds

### 10. **Exterior & Outdoor** 🌳 (Green #27AE60)
   - Exterior Decoration
   - Landscaping Work
   - Roofing Work

### 11. **Mechanical & HVAC** ❄️ (Cyan #00BCD4)
   - HVAC Work
   - Insulation Work

### 12. **Complete Projects** 🔑 (Purple #667eea)
   - Complete Interior Fit-out
   - Complete Renovation
   - Turnkey Project

### 13. **Other** ➕ (Gray #999)
   - Custom work type (text input)

---

## 💰 Expense Categories by Scope

Each scope has **relevant expense categories**. Examples:

### Carpentry Work Categories:
- 🌲 Wood Materials
- 🔨 Hardware & Fittings
- 🧰 Tools & Equipment
- 👷 Labor Cost
- 🚛 Transportation
- ⋯ Other

### Painting Work Categories:
- 🎨 Paint & Primer
- 🧱 Putty & Filler
- 🖌️ Brushes & Rollers
- 📏 Masking Materials
- 👷 Labor Cost
- ⋯ Other

### Electrical Work Categories:
- 🔌 Wiring & Cables
- 💡 Switches & Sockets
- ⚡ Circuit Breakers
- 🧰 Tools & Equipment
- 👷 Labor Cost
- ⋯ Other

**Total:** 41 scopes × ~5-6 categories each = **200+ contextual expense categories**

---

## 🗄️ Database Schema Changes

### 1. **Projects Table** - Already Updated
```sql
scope_of_work TEXT[]  -- Array of selected scopes
```

### 2. **Expenses Table** - New Column
```sql
ALTER TABLE expenses 
ADD COLUMN scope_of_work TEXT;  -- Links expense to specific scope

CREATE INDEX idx_expenses_scope_of_work ON expenses (scope_of_work);
```

### 3. **Views for Analytics**

**expense_by_scope** - Aggregated expenses per scope:
```sql
SELECT 
  project_id,
  scope_of_work,
  category,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount
FROM expenses
GROUP BY project_id, scope_of_work, category;
```

**project_scope_budget** - Budget tracking per scope:
```sql
SELECT 
  project_name,
  scope,
  scope_expenses,
  remaining_budget
FROM projects WITH expenses grouped by scope;
```

---

## 🎨 UI/UX Implementation

### 1. **AddProject Form** - Categorized Scope Selection

**Before:**
```
[All 41 cards in one long grid]
```

**After:**
```
📁 Carpentry & Woodwork (6)
  [Carpentry] [Furniture] [Wardrobe] [Wood Floor] [Doors] [Stairs]

🎨 Painting & Finishes (5)
  [Painting] [Wallpaper] [Cladding] [Plastering] [POP]

🔧 Metalwork (3)
  [Aluminium] [Steel] [Railing]

... (collapsible categories)

➕ Other
  [Custom Work Type ___________]
```

**Features:**
- ✅ Collapsible category sections
- ✅ Category headers with icons & colors
- ✅ Count of work types per category
- ✅ "Other" text input at bottom
- ✅ Multi-select within categories
- ✅ Clear All button

**Implementation Pattern:**
```typescript
{SCOPE_CATEGORIES.map(category => (
  <View key={category.name}>
    <TouchableOpacity onPress={() => toggleCategory(category.name)}>
      <MaterialCommunityIcons name={category.icon} color={category.color} />
      <Text>{category.name} ({category.scopes.length})</Text>
      <Icon name={expanded ? "chevron-up" : "chevron-down"} />
    </TouchableOpacity>
    
    {expanded && (
      <View style={styles.scopeCardsGrid}>
        {category.scopes.map(scope => (
          <ScopeCard key={scope.value} scope={scope} />
        ))}
      </View>
    )}
  </View>
))}

{/* Other Option */}
<TextInput 
  placeholder="Enter custom work type"
  onChangeText={setOtherScope}
/>
```

---

### 2. **AddExpense Form** - Scope & Category Selection

**New Fields:**
1. **Scope Dropdown** (filtered by project's selected scopes)
2. **Category Dropdown** (dynamically populated based on selected scope)

**Flow:**
```
1. Select Project: "ABC Renovation"
   ↓
2. Available Scopes: [Carpentry, Painting, Electrical] (from project)
   ↓
3. Select Scope: "Carpentry Work"
   ↓
4. Available Categories: [Wood Materials, Hardware, Tools, Labor, Transportation]
   ↓
5. Select Category: "Wood Materials"
   ↓
6. Enter Amount & Description
```

**Implementation:**
```typescript
// 1. Get project's scopes
const [availableScopes, setAvailableScopes] = useState<ScopeOfWork[]>([]);

useEffect(() => {
  if (projectId) {
    const project = await getProjectById(projectId);
    setAvailableScopes(project.scope_of_work || []);
  }
}, [projectId]);

// 2. Get categories for selected scope
const [categories, setCategories] = useState<ExpenseCategory[]>([]);

useEffect(() => {
  if (selectedScope) {
    setCategories(getCategoriesForScope(selectedScope));
  }
}, [selectedScope]);
```

**Visual Design:**
```
┌─────────────────────────────┐
│ Select Scope of Work *      │
│ ┌─────────────────────────┐ │
│ │ 🔨 Carpentry Work    ▼ │ │
│ └─────────────────────────┘ │
│                             │
│ Select Category             │
│ ┌─────────────────────────┐ │
│ │ 🌲 Wood Materials    ▼ │ │
│ └─────────────────────────┘ │
│                             │
│ Amount *                    │
│ ₹ [______________]         │
│                             │
│ Description                 │
│ [_____________________]    │
└─────────────────────────────┘
```

---

### 3. **ExpenseDetails** - Show Scope & Category

Add badges:
```tsx
<View style={styles.expenseInfo}>
  {/* Scope Badge */}
  {expense.scope_of_work && (
    <View style={styles.scopeBadge}>
      <MaterialCommunityIcons name="file-document" size={14} />
      <Text>{expense.scope_of_work}</Text>
    </View>
  )}
  
  {/* Category Badge */}
  {expense.category && (
    <View style={styles.categoryBadge}>
      <Text>{expense.category}</Text>
    </View>
  )}
</View>
```

---

### 4. **ProjectDetails** - Expenses by Scope

**Group expenses by scope:**
```
Project: ABC Renovation
Total: ₹5,00,000

📊 Expenses by Scope:

🔨 Carpentry Work (₹1,50,000)
  - Wood Materials: ₹80,000
  - Hardware: ₹30,000
  - Labor: ₹40,000

🎨 Painting Work (₹75,000)
  - Paint & Primer: ₹45,000
  - Labor: ₹30,000

⚡ Electrical Work (₹1,25,000)
  - Wiring & Cables: ₹60,000
  - Fixtures: ₹40,000
  - Labor: ₹25,000
```

**Implementation:**
```typescript
const expensesByScope = expenses.reduce((acc, expense) => {
  const scope = expense.scope_of_work || 'Uncategorized';
  if (!acc[scope]) acc[scope] = [];
  acc[scope].push(expense);
  return acc;
}, {});

// Render
{Object.entries(expensesByScope).map(([scope, scopeExpenses]) => (
  <View key={scope}>
    <Text>{scope} (₹{sum(scopeExpenses)})</Text>
    {scopeExpenses.map(exp => <ExpenseItem expense={exp} />)}
  </View>
))}
```

---

## 📱 User Flows

### Flow 1: Create Project with Multiple Scopes
```
1. Open "New Project"
2. Enter: Name, Client, Cost
3. Scroll to "Scope of Work"
4. Expand "Carpentry & Woodwork" → Select "Carpentry Work"
5. Expand "Painting & Finishes" → Select "Painting Work"
6. Expand "Other" → Type "Custom Metalwork"
7. See selection count: "Clear All (3)"
8. Save Project
```

### Flow 2: Add Expense to Specific Scope
```
1. Open "Add Expense"
2. Select Project: "ABC Renovation"
3. See available scopes: [Carpentry, Painting, Custom Metalwork]
4. Select Scope: "Carpentry Work"
5. See categories: [Wood Materials, Hardware, Tools, Labor...]
6. Select Category: "Wood Materials"
7. Enter: ₹15,000, "Plywood sheets"
8. Save Expense → Linked to "Carpentry Work" scope
```

### Flow 3: View Budget by Scope
```
1. Open Project Details
2. See "Expenses by Scope" section
3. View breakdown:
   - Carpentry: ₹45,000 / ₹1,00,000 (45%)
   - Painting: ₹20,000 / ₹75,000 (27%)
   - Other: ₹10,000 / ₹25,000 (40%)
4. Tap scope → See all expenses in that scope
```

---

## ✅ Implementation Checklist

### Phase 1: Schema & API ✅
- [x] Create SCOPE_CATEGORIES structure
- [x] Create EXPENSE_CATEGORIES_BY_SCOPE mapping
- [x] SQL migration for expense.scope_of_work
- [x] Update Expense interface
- [x] Add helper functions

### Phase 2: AddProject Form 🔄
- [ ] Implement collapsible category sections
- [ ] Add "Other" text input field
- [ ] Update card selection to work within categories
- [ ] Test multi-select across categories
- [ ] Update styles for categorized layout

### Phase 3: AddExpense Form 🔄
- [ ] Add scope dropdown (filtered by project)
- [ ] Add dynamic category dropdown
- [ ] Link scopes and categories
- [ ] Update form validation
- [ ] Test create/edit flows

### Phase 4: Display Updates 🔄
- [ ] ProjectDetails: Group expenses by scope
- [ ] ExpenseDetails: Show scope & category badges
- [ ] Home: Show scope count on cards
- [ ] Analytics: Add scope-based charts

### Phase 5: Migration & Testing 🔄
- [ ] Run SQL migrations
- [ ] Test with existing data
- [ ] Test new project creation
- [ ] Test expense tracking
- [ ] Performance testing

---

## 🎯 Benefits

### For Users:
1. **Organized** - 12 categories vs 41 flat options
2. **Flexible** - "Other" for custom work types
3. **Contextual** - Right expense categories per scope
4. **Trackable** - Budget per scope of work

### For Business:
1. **Better Insights** - Know which scope costs most
2. **Budget Control** - Track spending per work type
3. **Resource Planning** - Allocate by scope
4. **Accurate Quotes** - Historical data per scope

### For Reporting:
1. **Scope Analysis** - Which scopes are profitable?
2. **Category Trends** - Labor vs Materials ratio
3. **Project Comparison** - Similar scopes across projects
4. **Predictive** - Estimate costs for future scopes

---

## 📊 Example Use Case

**Project:** Modern Office Interior  
**Total Budget:** ₹15,00,000  
**Client:** Tech Startup Inc.

**Selected Scopes:**
1. 🔨 Carpentry Work (Budget: ₹3,00,000)
2. 🎨 Painting Work (Budget: ₹1,50,000)
3. ⚡ Electrical Work (Budget: ₹2,50,000)
4. 💡 Lighting Work (Budget: ₹2,00,000)
5. 🛋️ Interior Decoration (Budget: ₹4,00,000)
6. ❄️ HVAC Work (Budget: ₹2,00,000)

**Expenses Added:**
```
Date       Scope              Category        Amount
─────────────────────────────────────────────────────
Oct 15     Carpentry Work     Wood Materials  ₹75,000
Oct 16     Electrical Work    Wiring          ₹45,000
Oct 17     Carpentry Work     Labor           ₹30,000
Oct 18     Painting Work      Paint           ₹35,000
Oct 19     HVAC Work          AC Units        ₹90,000
```

**Dashboard View:**
```
Carpentry Work:     ₹1,05,000 / ₹3,00,000 (35%)
Electrical Work:    ₹45,000 / ₹2,50,000 (18%)
Painting Work:      ₹35,000 / ₹1,50,000 (23%)
HVAC Work:          ₹90,000 / ₹2,00,000 (45%) ⚠️
Lighting Work:      ₹0 / ₹2,00,000 (0%)
Interior Decoration: ₹0 / ₹4,00,000 (0%)
```

---

**Status:** 🔄 Schema Ready, UI Implementation In Progress  
**Created:** October 21, 2025  
**Next:** Implement categorized UI in AddProject & AddExpense
