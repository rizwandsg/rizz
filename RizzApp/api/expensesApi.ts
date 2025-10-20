import { database, TABLES } from '../services/databaseService';
import { getCurrentUser } from './authApi';

export interface Expense {
    id?: string;
    project_id: string;
    user_id?: string;
    amount: number;
    description: string;
    category?: string;
    expense_date: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Create a new expense
 */
export const createExpense = async (expense: Expense): Promise<Expense> => {
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