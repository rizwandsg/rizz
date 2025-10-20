# API Documentation

This folder contains all API modules for the RizzApp project.

## Structure

```
api/
├── authApi.ts       # Authentication API (signup, login, logout)
├── projectsApi.ts   # Projects API (CRUD operations)
├── expensesApi.ts   # Expenses API (CRUD operations)
└── index.ts         # Export all APIs
```

## Authentication API (`authApi.ts`)

### Functions

#### `signup(data: SignupData): Promise<User>`
Create a new user account.

```typescript
import { signup } from './api/authApi';

const user = await signup({
    email: 'user@example.com',
    password: 'securePassword123',
    full_name: 'John Doe'
});
```

#### `login(credentials: LoginCredentials): Promise<User>`
Login with email and password.

```typescript
import { login } from './api/authApi';

const user = await login({
    email: 'user@example.com',
    password: 'securePassword123'
});
```

#### `logout(): Promise<void>`
Logout the current user.

```typescript
import { logout } from './api/authApi';

await logout();
```

#### `getCurrentUser(): Promise<User | null>`
Get the currently logged-in user.

```typescript
import { getCurrentUser } from './api/authApi';

const user = await getCurrentUser();
```

#### `isAuthenticated(): Promise<boolean>`
Check if user is authenticated.

```typescript
import { isAuthenticated } from './api/authApi';

const authenticated = await isAuthenticated();
```

## Projects API (`projectsApi.ts`)

### Functions

#### `createProject(project: Project): Promise<Project>`
Create a new project.

```typescript
import { createProject } from './api/projectsApi';

const project = await createProject({
    name: 'New Project',
    description: 'Project description',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    status: 'active'
});
```

#### `getProjects(): Promise<Project[]>`
Get all projects for the current user.

```typescript
import { getProjects } from './api/projectsApi';

const projects = await getProjects();
```

#### `getProjectById(id: string): Promise<Project | null>`
Get a specific project by ID.

```typescript
import { getProjectById } from './api/projectsApi';

const project = await getProjectById('project-id');
```

#### `updateProject(id: string, updates: Partial<Project>): Promise<Project>`
Update a project.

```typescript
import { updateProject } from './api/projectsApi';

const updated = await updateProject('project-id', {
    name: 'Updated Name',
    status: 'completed'
});
```

#### `deleteProject(id: string): Promise<void>`
Delete a project.

```typescript
import { deleteProject } from './api/projectsApi';

await deleteProject('project-id');
```

#### `getProjectsByStatus(status: string): Promise<Project[]>`
Get projects by status.

```typescript
import { getProjectsByStatus } from './api/projectsApi';

const activeProjects = await getProjectsByStatus('active');
```

## Expenses API (`expensesApi.ts`)

### Functions

#### `createExpense(expense: Expense): Promise<Expense>`
Create a new expense.

```typescript
import { createExpense } from './api/expensesApi';

const expense = await createExpense({
    project_id: 'project-id',
    amount: 150.50,
    description: 'Office supplies',
    category: 'supplies',
    expense_date: '2025-01-15'
});
```

#### `getExpenses(): Promise<Expense[]>`
Get all expenses for the current user.

```typescript
import { getExpenses } from './api/expensesApi';

const expenses = await getExpenses();
```

#### `getExpensesByProject(projectId: string): Promise<Expense[]>`
Get expenses for a specific project.

```typescript
import { getExpensesByProject } from './api/expensesApi';

const expenses = await getExpensesByProject('project-id');
```

#### `getExpenseById(id: string): Promise<Expense | null>`
Get a specific expense by ID.

```typescript
import { getExpenseById } from './api/expensesApi';

const expense = await getExpenseById('expense-id');
```

#### `updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>`
Update an expense.

```typescript
import { updateExpense } from './api/expensesApi';

const updated = await updateExpense('expense-id', {
    amount: 200.00,
    description: 'Updated description'
});
```

#### `deleteExpense(id: string): Promise<void>`
Delete an expense.

```typescript
import { deleteExpense } from './api/expensesApi';

await deleteExpense('expense-id');
```

#### `getExpensesByCategory(category: string): Promise<Expense[]>`
Get expenses by category.

```typescript
import { getExpensesByCategory } from './api/expensesApi';

const supplies = await getExpensesByCategory('supplies');
```

#### `getTotalExpensesByProject(projectId: string): Promise<number>`
Get total expenses for a project.

```typescript
import { getTotalExpensesByProject } from './api/expensesApi';

const total = await getTotalExpensesByProject('project-id');
```

#### `getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]>`
Get expenses within a date range.

```typescript
import { getExpensesByDateRange } from './api/expensesApi';

const expenses = await getExpensesByDateRange('2025-01-01', '2025-12-31');
```

## Usage Examples

### Complete User Flow

```typescript
import { 
    signup, 
    login, 
    logout, 
    getCurrentUser 
} from './api/authApi';
import { 
    createProject, 
    getProjects 
} from './api/projectsApi';
import { 
    createExpense, 
    getExpensesByProject 
} from './api/expensesApi';

// 1. Signup
const user = await signup({
    email: 'user@example.com',
    password: 'password123',
    full_name: 'John Doe'
});

// 2. Create a project
const project = await createProject({
    name: 'Website Redesign',
    description: 'Redesign company website',
    start_date: '2025-01-01',
    end_date: '2025-06-30'
});

// 3. Add expenses to the project
await createExpense({
    project_id: project.id!,
    amount: 500.00,
    description: 'Design software license',
    category: 'software',
    expense_date: '2025-01-15'
});

// 4. Get all expenses for the project
const expenses = await getExpensesByProject(project.id!);
console.log('Total expenses:', expenses.length);

// 5. Logout
await logout();
```

## Error Handling

All API functions throw errors that should be caught:

```typescript
try {
    const projects = await getProjects();
} catch (error) {
    console.error('Failed to load projects:', error);
    // Handle error appropriately
}
```

## TypeScript Types

All types are exported from their respective API files:

```typescript
import type { User, LoginCredentials, SignupData } from './api/authApi';
import type { Project } from './api/projectsApi';
import type { Expense } from './api/expensesApi';
```