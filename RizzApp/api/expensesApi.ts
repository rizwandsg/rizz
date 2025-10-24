import { database, TABLES } from '../services/databaseService';
import { areNotificationsEnabled, NotificationType, sendAppNotification } from '../services/notificationService';
import { getCurrentUser } from './authApi';
import { ScopeOfWork } from './projectsApi';

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Check' | 'Card' | 'Other';
export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial';

export interface Expense {
    id?: string;
    project_id: string;
    user_id?: string;
    amount: number;
    description: string;
    category?: string;
    scope_of_work?: ScopeOfWork | 'Other'; // Link to specific scope within project
    vendor_name?: string; // Vendor/Supplier name
    vendor_contact?: string; // Vendor phone/email
    payment_method?: PaymentMethod; // How payment was made
    payment_status?: PaymentStatus; // Payment status
    expense_date: string;
    created_at?: string;
    updated_at?: string;
}

export interface VendorInfo {
    vendor_name: string;
    vendor_contact: string;
    last_used: string;
    total_expenses: number;
    total_amount: number;
}

/**
 * Create a new expense
 */
export const createExpense = async (expense: Expense, projectName?: string): Promise<Expense> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const newExpense = {
            ...expense,
            user_id: user.id,
        };

        const result = await database.saveData<Expense>(TABLES.EXPENSES, newExpense);
        
        // Send notification for expense creation
        try {
            const notificationsEnabled = await areNotificationsEnabled();
            if (notificationsEnabled) {
                await sendAppNotification(NotificationType.EXPENSE_ADDED, {
                    expenseAmount: result.amount,
                    projectName: projectName || 'Project',
                    expenseId: result.id,
                    description: result.description,
                });
                console.log('✅ Expense creation notification sent');
            }
        } catch (notifError) {
            console.error('⚠️ Failed to send expense notification:', notifError);
            // Don't throw - notification failure shouldn't break expense creation
        }
        
        return result;
    } catch (error) {
        console.error('Create expense error:', error);
        throw error;
    }
};

/**
 * Get all expenses for the current user
 */
export const getExpenses = async (): Promise<Expense[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expenses = await database.loadData<Expense>(TABLES.EXPENSES, {
            filter: `user_id.eq.${user.id}`,
            order: 'expense_date.desc'
        });

        return expenses || [];
    } catch (error) {
        console.error('Get expenses error:', error);
        throw error;
    }
};

/**
 * Get expenses by project ID
 */
export const getExpensesByProject = async (projectId: string): Promise<Expense[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expenses = await database.loadData<Expense>(TABLES.EXPENSES, {
            filter: `user_id.eq.${user.id},project_id.eq.${projectId}`,
            order: 'expense_date.desc'
        });

        return expenses || [];
    } catch (error) {
        console.error('Get expenses by project error:', error);
        throw error;
    }
};

/**
 * Get a single expense by ID
 */
export const getExpenseById = async (id: string): Promise<Expense | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expense = await database.loadDataById<Expense>(TABLES.EXPENSES, id);
        
        // Verify the expense belongs to the current user
        if (expense && expense.user_id !== user.id) {
            throw new Error('Unauthorized access to expense');
        }

        return expense;
    } catch (error) {
        console.error('Get expense by ID error:', error);
        throw error;
    }
};

/**
 * Update an expense
 */
export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the expense belongs to the current user
        const existingExpense = await database.loadDataById<Expense>(TABLES.EXPENSES, id);
        if (!existingExpense || existingExpense.user_id !== user.id) {
            throw new Error('Unauthorized access to expense');
        }

        const updatedExpense = {
            ...existingExpense,
            ...updates,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await database.upsertData<Expense>(TABLES.EXPENSES, updatedExpense);
        return result;
    } catch (error) {
        console.error('Update expense error:', error);
        throw error;
    }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (id: string): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the expense belongs to the current user
        const existingExpense = await database.loadDataById<Expense>(TABLES.EXPENSES, id);
        if (!existingExpense || existingExpense.user_id !== user.id) {
            throw new Error('Unauthorized access to expense');
        }

        await database.deleteData(TABLES.EXPENSES, id);
    } catch (error) {
        console.error('Delete expense error:', error);
        throw error;
    }
};

/**
 * Get expenses by category
 */
export const getExpensesByCategory = async (category: string): Promise<Expense[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expenses = await database.loadData<Expense>(TABLES.EXPENSES, {
            filter: `user_id.eq.${user.id},category.eq.${category}`,
            order: 'expense_date.desc'
        });

        return expenses || [];
    } catch (error) {
        console.error('Get expenses by category error:', error);
        throw error;
    }
};

/**
 * Get total expenses for a project
 */
export const getTotalExpensesByProject = async (projectId: string): Promise<number> => {
    try {
        const expenses = await getExpensesByProject(projectId);
        return expenses.reduce((total, expense) => total + expense.amount, 0);
    } catch (error) {
        console.error('Get total expenses error:', error);
        throw error;
    }
};

/**
 * Get unique vendors from user's expenses
 */
export const getUniqueVendors = async (): Promise<VendorInfo[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expenses = await database.loadData<Expense>(TABLES.EXPENSES, {
            filter: `user_id.eq.${user.id}`,
            order: 'created_at.desc'
        });

        if (!expenses) return [];

        // Group by vendor_name and get unique vendors with their info
        const vendorMap = new Map<string, VendorInfo>();
        
        expenses.forEach(expense => {
            if (expense.vendor_name && expense.vendor_name.trim()) {
                const existing = vendorMap.get(expense.vendor_name);
                if (!existing) {
                    vendorMap.set(expense.vendor_name, {
                        vendor_name: expense.vendor_name,
                        vendor_contact: expense.vendor_contact || '',
                        last_used: expense.created_at || new Date().toISOString(),
                        total_expenses: 1,
                        total_amount: expense.amount
                    });
                } else {
                    existing.total_expenses += 1;
                    existing.total_amount += expense.amount;
                    // Keep the most recent contact info
                    if (expense.vendor_contact && !existing.vendor_contact) {
                        existing.vendor_contact = expense.vendor_contact;
                    }
                }
            }
        });

        // Convert to array and sort by last used
        return Array.from(vendorMap.values()).sort((a, b) => 
            new Date(b.last_used).getTime() - new Date(a.last_used).getTime()
        );
    } catch (error) {
        console.error('Get unique vendors error:', error);
        return [];
    }
};

/**
 * Payment method options with icons
 */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string; color: string }[] = [
    { value: 'Cash', label: 'Cash', icon: 'cash', color: '#27ae60' },
    { value: 'UPI', label: 'UPI', icon: 'cellphone', color: '#9b59b6' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'bank-transfer', color: '#3498db' },
    { value: 'Check', label: 'Check', icon: 'checkbook', color: '#e67e22' },
    { value: 'Card', label: 'Card', icon: 'credit-card', color: '#e74c3c' },
    { value: 'Other', label: 'Other', icon: 'help-circle', color: '#95a5a6' },
];

/**
 * Payment status options with colors
 */
export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
    { value: 'Paid', label: 'Paid', color: '#27ae60' },
    { value: 'Unpaid', label: 'Unpaid', color: '#e74c3c' },
    { value: 'Partial', label: 'Partial', color: '#f39c12' },
];

/**
 * Get expenses within a date range
 */
export const getExpensesByDateRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const expenses = await database.loadData<Expense>(TABLES.EXPENSES, {
            filter: `user_id.eq.${user.id},expense_date.gte.${startDate},expense_date.lte.${endDate}`,
            order: 'expense_date.desc'
        });

        return expenses || [];
    } catch (error) {
        console.error('Get expenses by date range error:', error);
        throw error;
    }
};