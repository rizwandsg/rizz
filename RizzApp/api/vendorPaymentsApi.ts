import { database } from '../services/databaseService';
import { getCurrentUser } from './authApi';
import { PaymentMethod } from './customerPaymentsApi';

export interface VendorPayment {
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

export interface ExpensePaymentStatus {
    expense_id: string;
    project_id: string;
    expense_description: string;
    expense_amount: number;
    category?: string;
    scope_of_work?: string;
    expense_date: string;
    total_paid: number;
    outstanding_amount: number;
    payment_status: 'Unpaid' | 'Partial' | 'Paid' | 'Unknown';
    payment_progress_percentage: number;
    payment_count: number;
}

/**
 * Create a new vendor payment
 */
export const createVendorPayment = async (payment: VendorPayment): Promise<VendorPayment> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const newPayment = {
            ...payment,
            user_id: user.id,
        };

        const result = await database.saveData<VendorPayment>('vendor_payments', newPayment);
        return result;
    } catch (error) {
        console.error('Create vendor payment error:', error);
        throw error;
    }
};

/**
 * Get all vendor payments for an expense
 */
export const getVendorPaymentsByExpense = async (expenseId: string): Promise<VendorPayment[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<VendorPayment>(
            'vendor_payments',
            {
                filter: `user_id.eq.${user.id},expense_id.eq.${expenseId}`,
                order: 'payment_date.desc'
            }
        );

        return result || [];
    } catch (error) {
        console.error('Get vendor payments by expense error:', error);
        throw error;
    }
};

/**
 * Get all vendor payments for a project
 */
export const getVendorPaymentsByProject = async (projectId: string): Promise<VendorPayment[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<VendorPayment>(
            'vendor_payments',
            {
                filter: `user_id.eq.${user.id},project_id.eq.${projectId}`,
                order: 'payment_date.desc'
            }
        );

        return result || [];
    } catch (error) {
        console.error('Get vendor payments by project error:', error);
        throw error;
    }
};

/**
 * Get a single vendor payment by ID
 */
export const getVendorPaymentById = async (id: string): Promise<VendorPayment | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadDataById<VendorPayment>('vendor_payments', id);

        // Verify the payment belongs to the current user
        if (result && result.user_id !== user.id) {
            throw new Error('Unauthorized access to payment');
        }

        return result;
    } catch (error) {
        console.error('Get vendor payment error:', error);
        throw error;
    }
};

/**
 * Update a vendor payment
 */
export const updateVendorPayment = async (id: string, payment: Partial<VendorPayment>): Promise<VendorPayment> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the payment belongs to the current user
        const existingPayment = await database.loadDataById<VendorPayment>('vendor_payments', id);
        if (!existingPayment || existingPayment.user_id !== user.id) {
            throw new Error('Unauthorized access to payment');
        }

        const updatedPayment = {
            ...existingPayment,
            ...payment,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await database.upsertData<VendorPayment>('vendor_payments', updatedPayment);
        return result;
    } catch (error) {
        console.error('Update vendor payment error:', error);
        throw error;
    }
};

/**
 * Delete a vendor payment
 */
export const deleteVendorPayment = async (id: string): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the payment belongs to the current user
        const existingPayment = await database.loadDataById<VendorPayment>('vendor_payments', id);
        if (!existingPayment || existingPayment.user_id !== user.id) {
            throw new Error('Unauthorized access to payment');
        }

        await database.deleteData('vendor_payments', id);
    } catch (error) {
        console.error('Delete vendor payment error:', error);
        throw error;
    }
};

/**
 * Get payment status for an expense
 */
export const getExpensePaymentStatus = async (expenseId: string): Promise<ExpensePaymentStatus | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<ExpensePaymentStatus>(
            'expense_payment_status',
            {
                filter: `expense_id.eq.${expenseId}`
            }
        );

        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Get expense payment status error:', error);
        throw error;
    }
};

/**
 * Calculate total paid for an expense
 */
export const calculateTotalPaid = async (expenseId: string): Promise<number> => {
    try {
        const payments = await getVendorPaymentsByExpense(expenseId);
        return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
        console.error('Calculate total paid error:', error);
        return 0;
    }
};
