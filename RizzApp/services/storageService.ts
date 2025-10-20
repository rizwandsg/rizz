import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, TABLES } from './databaseService';

// Storage keys for local storage
const STORAGE_KEYS = {
    PROJECTS: '@rizzapp_projects',
    EXPENSES: '@rizzapp_expenses'
};

// Sync status tracking
let lastSyncTime: number | null = null;
let unsyncedChanges: boolean = false;
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if sync is needed
 */
const shouldSync = (): boolean => {
    if (!lastSyncTime) return true;
    return Date.now() - lastSyncTime > SYNC_INTERVAL || unsyncedChanges;
};

/**
 * Sync local data with Supabase
 */
const syncWithDatabase = async (): Promise<void> => {
    try {
        // Sync projects
        const projectsData = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
        if (projectsData) {
            const projects = JSON.parse(projectsData);
            await database.upsertData(TABLES.PROJECTS, projects);
            console.log('Projects synced to database');
        }

        // Sync expenses
        const expensesData = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
        if (expensesData) {
            const expenses = JSON.parse(expensesData);
            await database.upsertData(TABLES.EXPENSES, expenses);
            console.log('Expenses synced to database');
        }

        lastSyncTime = Date.now();
        unsyncedChanges = false;
    } catch (error) {
        console.error('Failed to sync with database:', error);
        unsyncedChanges = true;
        // Don't throw error to allow local storage to continue working
    }
};

/**
 * Load data from Supabase
 */
const loadFromDatabase = async (): Promise<void> => {
    try {
        // Load projects
        const projects = await database.loadData(TABLES.PROJECTS);
        if (projects) {
            await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
            console.log('Projects loaded from database');
        }

        // Load expenses
        const expenses = await database.loadData(TABLES.EXPENSES);
        if (expenses) {
            await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
            console.log('Expenses loaded from database');
        }

        lastSyncTime = Date.now();
        unsyncedChanges = false;
    } catch (error) {
        console.error('Failed to load from database:', error);
        unsyncedChanges = true;
        // Continue with local data if database sync fails
    }
};

export const storage = {
    /**
     * Save data with automatic sync to database
     */
    saveData: async (key: string, data: any): Promise<void> => {
        const jsonData = JSON.stringify(data);
        await AsyncStorage.setItem(key, jsonData);
        unsyncedChanges = true;
        
        if (shouldSync()) {
            await syncWithDatabase();
        }
    },

    /**
     * Load data with automatic sync from database
     */
    loadData: async <T>(key: string): Promise<T | null> => {
        if (shouldSync()) {
            await loadFromDatabase();
        }

        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    /**
     * Force sync with database
     */
    sync: async (): Promise<void> => {
        await syncWithDatabase();
    },

    /**
     * Get the timestamp of the last successful sync
     */
    getLastSyncTime: async (): Promise<number | null> => {
        return lastSyncTime;
    },

    /**
     * Check if there are any unsynced changes
     */
    hasUnsyncedChanges: async (): Promise<boolean> => {
        return unsyncedChanges;
    },

    /**
     * Clear all local data
     */
    clearData: async (): Promise<void> => {
        await AsyncStorage.multiRemove([STORAGE_KEYS.PROJECTS, STORAGE_KEYS.EXPENSES]);
        lastSyncTime = null;
    }
};

export { STORAGE_KEYS };
