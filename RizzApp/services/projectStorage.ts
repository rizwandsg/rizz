import { Project } from '../database/projectService';
import { downloadFile, findOrCreateAppFolder, initGoogleDrive, uploadFile } from './googleDriveService';

const PROJECTS_FILE = 'rizzapp_projects.json';
const EXPENSES_FILE = 'rizzapp_expenses.json';
let appFolderId: string | null = null;

// Initialize storage
const initStorage = async () => {
    if (!appFolderId) {
        await initGoogleDrive();
        appFolderId = await findOrCreateAppFolder();
    }
};

// Load projects from Google Drive
const loadProjects = async (): Promise<Project[]> => {
    try {
        await initStorage();
        const content = await downloadFile(PROJECTS_FILE, appFolderId!);
        return content ? JSON.parse(content) as Project[] : [];
    } catch (error) {
        console.error('Error loading projects from Google Drive:', error);
        throw new Error('Failed to load projects from Google Drive');
    }
};

// Save projects to Google Drive
const saveProjects = async (projects: Project[]): Promise<void> => {
    try {
        await initStorage();
        const content = JSON.stringify(projects, null, 2);
        await uploadFile(PROJECTS_FILE, content, appFolderId!);
    } catch (error) {
        console.error('Error saving projects to Google Drive:', error);
        throw new Error('Failed to save projects to Google Drive');
    }
};

// Find a project by ID
const findProjectById = (projects: Project[], id: string): Project | undefined => {
    return projects.find(p => p.id === id);
};

// Load expenses from Google Drive
const loadExpenses = async (): Promise<any[]> => {
    try {
        await initStorage();
        const content = await downloadFile(EXPENSES_FILE, appFolderId!);
        return content ? JSON.parse(content) : [];
    } catch (error) {
        console.error('Error loading expenses from Google Drive:', error);
        throw new Error('Failed to load expenses from Google Drive');
    }
};

// Save expenses to Google Drive
const saveExpenses = async (expenses: any[]): Promise<void> => {
    try {
        await initStorage();
        const content = JSON.stringify(expenses, null, 2);
        await uploadFile(EXPENSES_FILE, content, appFolderId!);
    } catch (error) {
        console.error('Error saving expenses to Google Drive:', error);
        throw new Error('Failed to save expenses to Google Drive');
    }
};

export default {
    loadProjects,
    saveProjects,
    findProjectById,
    loadExpenses,
    saveExpenses,
};