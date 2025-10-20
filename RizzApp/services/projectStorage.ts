import { Expense, Project } from '../database/types';
import { storage, STORAGE_KEYS } from './storageService';

// Load projects from storage
const loadProjects = async (): Promise<Project[]> => {
    try {
        const projects = await storage.loadData<Project[]>(STORAGE_KEYS.PROJECTS);
        return projects || [];
    } catch (error) {
        console.error('Error loading projects:', error);
        throw new Error('Failed to load projects');
    }
};

// Save projects to storage
const saveProjects = async (projects: Project[]): Promise<void> => {
    try {
        await storage.saveData(STORAGE_KEYS.PROJECTS, projects);
    } catch (error) {
        console.error('Error saving projects:', error);
        throw new Error('Failed to save projects');
    }
};

// Find a project by ID
const findProjectById = (projects: Project[], id: string): Project | undefined => {
    return projects.find(p => p.id === id);
};

// Load expenses from storage
const loadExpenses = async (): Promise<Expense[]> => {
    try {
        const expenses = await storage.loadData<Expense[]>(STORAGE_KEYS.EXPENSES);
        return expenses || [];
    } catch (error) {
        console.error('Error loading expenses:', error);
        throw new Error('Failed to load expenses');
    }
};

// Save expenses to storage
const saveExpenses = async (expenses: Expense[]): Promise<void> => {
    try {
        await storage.saveData(STORAGE_KEYS.EXPENSES, expenses);
    } catch (error) {
        console.error('Error saving expenses:', error);
        throw new Error('Failed to save expenses');
    }
};

// Sync data with cloud storage
const syncWithCloud = async (): Promise<void> => {
    try {
        await storage.sync();
    } catch (error) {
        console.error('Error syncing with cloud:', error);
        throw new Error('Failed to sync with cloud storage');
    }
};

// Get the timestamp of the last successful sync
const getLastSyncTime = async (): Promise<Date | null> => {
    try {
        const timestamp = await storage.getLastSyncTime();
        return timestamp ? new Date(timestamp) : null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        throw new Error('Failed to get last sync time');
    }
};

// Check if there are any unsynced changes
const hasUnsyncedChanges = async (): Promise<boolean> => {
    try {
        return await storage.hasUnsyncedChanges();
    } catch (error) {
        console.error('Error checking unsynced changes:', error);
        throw new Error('Failed to check unsynced changes');
    }
};

export interface ProjectStorage {
    loadProjects: () => Promise<Project[]>;
    saveProjects: (projects: Project[]) => Promise<void>;
    findProjectById: (projects: Project[], id: string) => Project | undefined;
    loadExpenses: () => Promise<Expense[]>;
    saveExpenses: (expenses: Expense[]) => Promise<void>;
    syncWithCloud: () => Promise<void>;
    getLastSyncTime: () => Promise<Date | null>;
    hasUnsyncedChanges: () => Promise<boolean>;
}

export default {
    loadProjects,
    saveProjects,
    findProjectById,
    loadExpenses,
    saveExpenses,
    syncWithCloud,
    getLastSyncTime,
    hasUnsyncedChanges,
} as ProjectStorage;