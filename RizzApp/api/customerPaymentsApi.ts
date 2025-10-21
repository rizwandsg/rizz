import { database } from '../services/databaseService';
import { getCurrentUser } from './authApi';

export type PaymentMethod = 
    | 'Cash' 
    | 'Check' 
    | 'Bank Transfer' 
    | 'UPI' 
    | 'Card' 
    | 'Other';

export interface CustomerPayment {
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

export interface ProjectPaymentSummary {
    project_id: string;
    project_name: string;
    client_name?: string;
    total_project_cost?: number;
    total_received: number;
    total_expenses: number;
    total_paid_to_vendors: number;
    outstanding_from_customer: number;
    outstanding_to_vendors: number;
    payment_status: 'Not Set' | 'Unpaid' | 'Partial' | 'Paid' | 'Unknown';
    payment_progress_percentage: number;
}

/**
 * Create a new customer payment
 */
export const createCustomerPayment = async (payment: CustomerPayment): Promise<CustomerPayment> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const newPayment = {
            ...payment,
            user_id: user.id,
        };

        const result = await database.saveData<CustomerPayment>('customer_payments', newPayment);
        return result;
    } catch (error) {
        console.error('Create customer payment error:', error);
        throw error;
    }
};

/**
 * Get all customer payments for a project
 */
export const getCustomerPaymentsByProject = async (projectId: string): Promise<CustomerPayment[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<CustomerPayment>(
            'customer_payments',
            {
                filter: `user_id.eq.${user.id},project_id.eq.${projectId}`,
                order: 'payment_date.desc'
            }
        );

        return result || [];
    } catch (error) {
        console.error('Get customer payments error:', error);
        throw error;
    }
};

/**
 * Get a single customer payment by ID
 */
export const getCustomerPaymentById = async (id: string): Promise<CustomerPayment | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadDataById<CustomerPayment>('customer_payments', id);

        // Verify the payment belongs to the current user
        if (result && result.user_id !== user.id) {
            throw new Error('Unauthorized access to payment');
        }

        return result;
    } catch (error) {
        console.error('Get customer payment error:', error);
        throw error;
    }
};

/**
 * Update a customer payment
 */
export const updateCustomerPayment = async (id: string, payment: Partial<CustomerPayment>): Promise<CustomerPayment> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the payment belongs to the current user
        const existingPayment = await database.loadDataById<CustomerPayment>('customer_payments', id);
        if (!existingPayment || existingPayment.user_id !== user.id) {
            throw new Error('Unauthorized access to payment');
        }

        const updatedPayment = {
            ...existingPayment,
            ...payment,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await database.upsertData<CustomerPayment>('customer_payments', updatedPayment);
        return result;
    } catch (error) {
        console.error('Update customer payment error:', error);
        throw error;
    }
};

/**
 * Delete a customer payment
 */
export const deleteCustomerPayment = async (id: string): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        await database.deleteData('customer_payments', id);
    } catch (error) {
        console.error('Delete customer payment error:', error);
        throw error;
    }
};

/**
 * Get payment summary for a project
 */
export const getProjectPaymentSummary = async (projectId: string): Promise<ProjectPaymentSummary | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<ProjectPaymentSummary>(
            'project_payment_summary',
            {
                filter: `project_id.eq.${projectId}`
            }
        );

        return result && result.length > 0 ? result[0] : null;
    } catch (error) {
        console.error('Get project payment summary error:', error);
        throw error;
    }
};

/**
 * Calculate total received for a project
 */
export const calculateTotalReceived = async (projectId: string): Promise<number> => {
    try {
        const payments = await getCustomerPaymentsByProject(projectId);
        return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
        console.error('Calculate total received error:', error);
        return 0;
    }
};

/**
 * Get payment methods as options for UI
 */
export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'Cash', label: 'Cash', icon: 'cash' },
    { value: 'Check', label: 'Check', icon: 'checkbook' },
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'bank-transfer' },
    { value: 'UPI', label: 'UPI', icon: 'cellphone' },
    { value: 'Card', label: 'Card', icon: 'credit-card' },
    { value: 'Other', label: 'Other', icon: 'help-circle' },
];
