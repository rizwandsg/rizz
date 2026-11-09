import { database, TABLES } from '../services/databaseService';
import { getCurrentUser } from './authApi';
import {numberedPaymentLabel,type NumberedPaymentType} from '../services/paymentStages';

export type PaymentType = 'Advance' | 'Milestone' | 'Final' | 'Partial' | 'Other' | NumberedPaymentType;
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Check' | 'Card' | 'Online';

export interface Payment {
    id?: string;
    project_id: string;
    user_id?: string;
    amount: number;
    payment_date: string;
    payment_type: PaymentType;
    payment_mode: PaymentMode;
    reference_number?: string;
    notes?: string;
    received_from?: string; // Client name or reference
    created_at?: string;
    updated_at?: string;
}

export interface PaymentSummary {
    total_received: number;
    total_expenses: number;
    project_cost: number;
    remaining_amount: number;
    profit_loss: number;
    payment_count: number;
}

/**
 * Payment types with icons and colors
 */
export const PAYMENT_TYPES = [
    { value: 'Advance' as PaymentType, label: 'Advance Payment', icon: 'cash-fast', color: '#4CAF50' },
    ...[1,2,3,4,5].map(number=>({value:numberedPaymentLabel(number) as PaymentType,label:numberedPaymentLabel(number),icon:'cash-multiple',color:'#2196F3'})),
    { value: 'Milestone' as PaymentType, label: 'Milestone Payment', icon: 'flag-checkered', color: '#2196F3' },
    { value: 'Final' as PaymentType, label: 'Final Payment', icon: 'cash-check', color: '#FF9800' },
    { value: 'Partial' as PaymentType, label: 'Partial Payment', icon: 'cash-multiple', color: '#9C27B0' },
    { value: 'Other' as PaymentType, label: 'Other', icon: 'cash', color: '#607D8B' },
];

/**
 * Payment modes with icons
 */
export const PAYMENT_MODES = [
    { value: 'Cash' as PaymentMode, label: 'Cash', icon: 'cash', color: '#4CAF50' },
    { value: 'UPI' as PaymentMode, label: 'UPI', icon: 'qrcode-scan', color: '#2196F3' },
    { value: 'Bank Transfer' as PaymentMode, label: 'Bank Transfer', icon: 'bank-transfer', color: '#FF9800' },
    { value: 'Check' as PaymentMode, label: 'Check', icon: 'checkbook', color: '#9C27B0' },
    { value: 'Card' as PaymentMode, label: 'Card', icon: 'credit-card', color: '#E91E63' },
    { value: 'Online' as PaymentMode, label: 'Online Payment', icon: 'web', color: '#00BCD4' },
];

/**
 * Create a new payment
 */
export const createPayment = async (payment: Payment): Promise<Payment> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const newPayment = {
            ...payment,
            user_id: user.id,
        };

        const result = await database.saveData(TABLES.PAYMENTS, newPayment);
        return result;
    } catch (error) {
        console.error('Create payment error:', error);
        throw error;
    }
};

/**
 * Get all payments for a project
 */
export const getPaymentsByProject = async (projectId: string): Promise<Payment[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<Payment>(TABLES.PAYMENTS, {
            filter: `project_id.eq.${projectId}`,
            order: 'payment_date.desc',
        });

        return result || [];
    } catch (error) {
        console.error('Get payments error:', error);
        throw error;
    }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment | null> => {
    try {
        const payment = await database.loadDataById<Payment>(TABLES.PAYMENTS, id);
        return payment;
    } catch (error) {
        console.error('Get payment error:', error);
        throw error;
    }
};

/**
 * Update a payment
 */
export const updatePayment = async (id: string, payment: Partial<Payment>): Promise<Payment> => {
    try {
        const result = await database.updateData(TABLES.PAYMENTS, id, payment);
        return result;
    } catch (error) {
        console.error('Update payment error:', error);
        throw error;
    }
};

/**
 * Delete a payment
 */
export const deletePayment = async (id: string): Promise<void> => {
    try {
        await database.deleteData(TABLES.PAYMENTS, id);
    } catch (error) {
        console.error('Delete payment error:', error);
        throw error;
    }
};

/**
 * Get payment summary for a project
 */
export const getPaymentSummary = async (projectId: string, _projectCost?: number, _totalExpenses?: number): Promise<PaymentSummary> => {
    if (!await getCurrentUser()) throw new Error('User not authenticated');
    const rows = await database.loadData<{ total_received: number; total_expenses: number; total_project_cost?: number; payment_count: number }>('project_payment_summary', { filter: 'project_id.eq.' + projectId });
    const summary = rows[0];
    if (!summary) throw new Error('Project not found or access denied');
    const cost = Number(summary.total_project_cost || 0);
    const received = Number(summary.total_received);
    const expenses = Number(summary.total_expenses);
    return { total_received: received, total_expenses: expenses, project_cost: cost, remaining_amount: cost - received, profit_loss: received - expenses, payment_count: Number(summary.payment_count) };
};

/**
 * Get all payments for the current user
 */
export const getAllPayments = async (): Promise<Payment[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const result = await database.loadData<Payment>(TABLES.PAYMENTS, {
            order: 'payment_date.desc',
        });

        return result || [];
    } catch (error) {
        console.error('Get all payments error:', error);
        throw error;
    }
};
