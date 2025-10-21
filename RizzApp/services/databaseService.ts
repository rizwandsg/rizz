import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey as string;

console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Configured' : 'Missing');

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database table names
const TABLES = {
    PROJECTS: 'projects',
    EXPENSES: 'expenses',
    PAYMENTS: 'payments',
};

export interface QueryOptions {
    filter?: string;
    order?: string;
    limit?: number;
}

export interface DatabaseService {
    saveData: <T>(table: string, data: T) => Promise<T>;
    loadData: <T>(table: string, options?: QueryOptions) => Promise<T[] | null>;
    loadDataById: <T>(table: string, id: string) => Promise<T | null>;
    upsertData: <T>(table: string, data: T) => Promise<T>;
    updateData: <T>(table: string, id: string, data: Partial<T>) => Promise<T>;
    deleteData: (table: string, id: string) => Promise<void>;
}

// Create and export instance of DatabaseService
export const database: DatabaseService = {
    saveData: async <T>(table: string, data: T): Promise<T> => {
        try {
            console.log(`Saving data to ${table}:`, data);
            const { data: result, error } = await supabase
                .from(table)
                .insert(data)
                .select()
                .single();

            if (error) {
                console.error(`Supabase error saving to ${table}:`, error);
                throw error;
            }
            
            console.log(`Successfully saved to ${table}:`, result);
            return result as T;
        } catch (error: any) {
            console.error(`Failed to save data to ${table}:`, error);
            throw new Error(error.message || `Failed to save data to ${table}`);
        }
    },

    loadData: async <T>(table: string, options?: QueryOptions): Promise<T[] | null> => {
        try {
            let query = supabase.from(table).select('*');

            // Apply filter if provided
            if (options?.filter) {
                const filters = options.filter.split(',');
                filters.forEach(f => {
                    const [column, operator, value] = f.split('.');
                    if (operator === 'eq') {
                        query = query.eq(column, value);
                    } else if (operator === 'neq') {
                        query = query.neq(column, value);
                    } else if (operator === 'gt') {
                        query = query.gt(column, value);
                    } else if (operator === 'lt') {
                        query = query.lt(column, value);
                    } else if (operator === 'gte') {
                        query = query.gte(column, value);
                    } else if (operator === 'lte') {
                        query = query.lte(column, value);
                    }
                });
            }

            // Apply order if provided
            if (options?.order) {
                const [column, direction] = options.order.split('.');
                query = query.order(column, { ascending: direction === 'asc' });
            }

            // Apply limit if provided
            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as T[];
        } catch (error) {
            console.error(`Failed to load data from ${table}:`, error);
            throw new Error(`Failed to load data from ${table}`);
        }
    },

    loadDataById: async <T>(table: string, id: string): Promise<T | null> => {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as T;
        } catch (error) {
            console.error(`Failed to load data from ${table}:`, error);
            throw new Error(`Failed to load data from ${table}`);
        }
    },

    upsertData: async <T>(table: string, data: T): Promise<T> => {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .upsert(data)
                .select()
                .single();

            if (error) throw error;
            return result as T;
        } catch (error) {
            console.error(`Failed to upsert data in ${table}:`, error);
            throw new Error(`Failed to upsert data in ${table}`);
        }
    },

    updateData: async <T>(table: string, id: string, data: Partial<T>): Promise<T> => {
        try {
            const { data: result, error } = await supabase
                .from(table)
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return result as T;
        } catch (error) {
            console.error(`Failed to update data in ${table}:`, error);
            throw new Error(`Failed to update data in ${table}`);
        }
    },

    deleteData: async (table: string, id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error(`Failed to delete data from ${table}:`, error);
            throw new Error(`Failed to delete data from ${table}`);
        }
    },
};

export { TABLES };
