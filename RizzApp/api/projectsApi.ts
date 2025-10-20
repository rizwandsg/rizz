import { database, TABLES } from '../services/databaseService';
import { getCurrentUser } from './authApi';

export interface Project {
    id?: string;
    user_id?: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Create a new project
 */
export const createProject = async (project: Project): Promise<Project> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const newProject = {
            ...project,
            user_id: user.id,
            status: project.status || 'active',
        };

        const result = await database.saveData<Project>(TABLES.PROJECTS, newProject);
        return result;
    } catch (error) {
        console.error('Create project error:', error);
        throw error;
    }
};

/**
 * Get all projects for the current user
 */
export const getProjects = async (): Promise<Project[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const projects = await database.loadData<Project>(TABLES.PROJECTS, {
            filter: `user_id.eq.${user.id}`,
            order: 'created_at.desc'
        });

        return projects || [];
    } catch (error) {
        console.error('Get projects error:', error);
        throw error;
    }
};

/**
 * Get a single project by ID
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const project = await database.loadDataById<Project>(TABLES.PROJECTS, id);
        
        // Verify the project belongs to the current user
        if (project && project.user_id !== user.id) {
            throw new Error('Unauthorized access to project');
        }

        return project;
    } catch (error) {
        console.error('Get project by ID error:', error);
        throw error;
    }
};

/**
 * Update a project
 */
export const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the project belongs to the current user
        const existingProject = await database.loadDataById<Project>(TABLES.PROJECTS, id);
        if (!existingProject || existingProject.user_id !== user.id) {
            throw new Error('Unauthorized access to project');
        }

        const updatedProject = {
            ...existingProject,
            ...updates,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await database.upsertData<Project>(TABLES.PROJECTS, updatedProject);
        return result;
    } catch (error) {
        console.error('Update project error:', error);
        throw error;
    }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Verify the project belongs to the current user
        const existingProject = await database.loadDataById<Project>(TABLES.PROJECTS, id);
        if (!existingProject || existingProject.user_id !== user.id) {
            throw new Error('Unauthorized access to project');
        }

        await database.deleteData(TABLES.PROJECTS, id);
    } catch (error) {
        console.error('Delete project error:', error);
        throw error;
    }
};

/**
 * Get projects by status
 */
export const getProjectsByStatus = async (status: string): Promise<Project[]> => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const projects = await database.loadData<Project>(TABLES.PROJECTS, {
            filter: `user_id.eq.${user.id},status.eq.${status}`,
            order: 'created_at.desc'
        });

        return projects || [];
    } catch (error) {
        console.error('Get projects by status error:', error);
        throw error;
    }
};