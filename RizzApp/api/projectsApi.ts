import { database, TABLES } from '../services/databaseService';
import { areNotificationsEnabled, NotificationType, sendAppNotification } from '../services/notificationService';
import { getCurrentUser } from './authApi';

export type ScopeOfWork = 
    | 'Carpentry Work'
    | 'Painting Work'
    | 'Aluminium Work'
    | 'Electrical Work'
    | 'Plumbing Work'
    | 'Flooring Work'
    | 'False Ceiling Work'
    | 'Masonry Work'
    | 'Tiling Work'
    | 'Glazing Work'
    | 'Door & Window Work'
    | 'Kitchen & Modular Work'
    | 'Interior Decoration'
    | 'Exterior Decoration'
    | 'Landscaping Work'
    | 'HVAC Work'
    | 'Waterproofing Work'
    | 'Structural Work'
    | 'Civil Work'
    | 'Plastering Work'
    | 'Wallpaper Work'
    | 'Furniture Work'
    | 'Lighting Work'
    | 'Partition Work'
    | 'Plaster of Paris Work'
    | 'Wood Flooring'
    | 'Marble & Granite Work'
    | 'Steel Fabrication'
    | 'Railing Work'
    | 'Staircase Work'
    | 'Bathroom Fitting'
    | 'Wardrobe Work'
    | 'Curtain & Blinds'
    | 'Wall Cladding'
    | 'Roofing Work'
    | 'Insulation Work'
    | 'Demolition Work'
    | 'Site Preparation'
    | 'Traveling Expenses'
    | 'Complete Interior Fit-out'
    | 'Complete Renovation'
    | 'Turnkey Project';

export interface ScopeCategory {
    name: string;
    icon: string;
    color: string;
    scopes: {
        value: ScopeOfWork;
        icon: string;
    }[];
}

export const SCOPE_CATEGORIES: ScopeCategory[] = [
    {
        name: 'Carpentry & Woodwork',
        icon: 'hammer-screwdriver',
        color: '#8B4513',
        scopes: [
            { value: 'Carpentry Work', icon: 'hammer-screwdriver' },
            { value: 'Furniture Work', icon: 'table-furniture' },
            { value: 'Wardrobe Work', icon: 'wardrobe' },
            { value: 'Wood Flooring', icon: 'pine-tree' },
            { value: 'Door & Window Work', icon: 'door' },
            { value: 'Staircase Work', icon: 'stairs' },
        ]
    },
    {
        name: 'Painting & Finishes',
        icon: 'format-paint',
        color: '#FF6B6B',
        scopes: [
            { value: 'Painting Work', icon: 'format-paint' },
            { value: 'Wallpaper Work', icon: 'wallpaper' },
            { value: 'Wall Cladding', icon: 'wall-sconce-flat' },
            { value: 'Plastering Work', icon: 'texture' },
            { value: 'Plaster of Paris Work', icon: 'spray' },
        ]
    },
    {
        name: 'Metalwork',
        icon: 'wrench',
        color: '#546E7A',
        scopes: [
            { value: 'Aluminium Work', icon: 'window-closed-variant' },
            { value: 'Steel Fabrication', icon: 'wrench' },
            { value: 'Railing Work', icon: 'fence' },
        ]
    },
    {
        name: 'Civil & Structural',
        icon: 'home-variant',
        color: '#34495E',
        scopes: [
            { value: 'Structural Work', icon: 'home-variant' },
            { value: 'Civil Work', icon: 'hard-hat' },
            { value: 'Masonry Work', icon: 'wall' },
            { value: 'Demolition Work', icon: 'hammer-wrench' },
            { value: 'Site Preparation', icon: 'excavator' },
        ]
    },
    {
        name: 'Flooring & Tiling',
        icon: 'grid',
        color: '#16A085',
        scopes: [
            { value: 'Flooring Work', icon: 'floor-plan' },
            { value: 'Tiling Work', icon: 'grid' },
            { value: 'Marble & Granite Work', icon: 'square' },
        ]
    },
    {
        name: 'Electrical & Lighting',
        icon: 'flash',
        color: '#F39C12',
        scopes: [
            { value: 'Electrical Work', icon: 'flash' },
            { value: 'Lighting Work', icon: 'lightbulb-on' },
        ]
    },
    {
        name: 'Plumbing & Sanitary',
        icon: 'pipe',
        color: '#3498DB',
        scopes: [
            { value: 'Plumbing Work', icon: 'pipe' },
            { value: 'Bathroom Fitting', icon: 'shower' },
            { value: 'Waterproofing Work', icon: 'water-off' },
        ]
    },
    {
        name: 'Ceiling & Partition',
        icon: 'ceiling-light',
        color: '#9B59B6',
        scopes: [
            { value: 'False Ceiling Work', icon: 'ceiling-light' },
            { value: 'Partition Work', icon: 'view-split-vertical' },
            { value: 'Glazing Work', icon: 'window-open-variant' },
        ]
    },
    {
        name: 'Interior & Decor',
        icon: 'sofa',
        color: '#E91E63',
        scopes: [
            { value: 'Interior Decoration', icon: 'sofa' },
            { value: 'Kitchen & Modular Work', icon: 'countertop' },
            { value: 'Curtain & Blinds', icon: 'blinds' },
        ]
    },
    {
        name: 'Exterior & Outdoor',
        icon: 'home-city',
        color: '#27AE60',
        scopes: [
            { value: 'Exterior Decoration', icon: 'home-city' },
            { value: 'Landscaping Work', icon: 'tree' },
            { value: 'Roofing Work', icon: 'home-roof' },
        ]
    },
    {
        name: 'Mechanical & HVAC',
        icon: 'air-conditioner',
        color: '#00BCD4',
        scopes: [
            { value: 'HVAC Work', icon: 'air-conditioner' },
            { value: 'Insulation Work', icon: 'thermometer' },
        ]
    },
    {
        name: 'Traveling & Miscellaneous',
        icon: 'car',
        color: '#FF5722',
        scopes: [
            { value: 'Traveling Expenses', icon: 'car-multiple' },
        ]
    },
    {
        name: 'Complete Projects',
        icon: 'key-variant',
        color: '#667eea',
        scopes: [
            { value: 'Complete Interior Fit-out', icon: 'home-modern' },
            { value: 'Complete Renovation', icon: 'home-edit' },
            { value: 'Turnkey Project', icon: 'key-variant' },
        ]
    },
];

export interface Project {
    id?: string;
    user_id?: string;
    name: string;
    client_name?: string;
    description?: string;
    start_date: string;
    end_date?: string;
    status?: string;
    total_project_cost?: number;
    scope_of_work?: ScopeOfWork[]; // Array to support multiple selections
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
        
        // Send notification for project creation
        try {
            console.log('🔔 Attempting to send project creation notification...');
            const notificationsEnabled = await areNotificationsEnabled();
            console.log('🔔 Notifications enabled:', notificationsEnabled);
            if (notificationsEnabled) {
                console.log('🔔 Calling sendAppNotification...');
                await sendAppNotification(NotificationType.PROJECT_CREATED, {
                    projectName: result.name,
                    projectId: result.id,
                });
                console.log('✅ Project creation notification sent');
            } else {
                console.log('⚠️ Notifications are disabled in settings');
            }
        } catch (notifError) {
            console.error('⚠️ Failed to send project notification:', notifError);
            // Don't throw - notification failure shouldn't break project creation
        }
        
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

        console.log('📂 Loading projects for user:', user.email, 'role:', user.role);
        console.log('🆔 User ID:', user.id);

        // Load ALL projects (RLS is set to true, we filter in JavaScript)
        const allProjects = await database.loadData<Project>(TABLES.PROJECTS, {
            order: 'created_at.desc'
        });

        if (!allProjects) return [];

        console.log('📊 Total projects in database:', allProjects.length);
        console.log('👤 Project owners:', [...new Set(allProjects.map(p => p.user_id))]);

        // Get list of user IDs that this user can see projects from
        const accessibleUserIds: string[] = [user.id];

        // If user is a member (sub-user), also include parent's projects
        if (user.parent_user_id) {
            accessibleUserIds.push(user.parent_user_id);
            console.log('👥 Sub-user - including parent projects:', user.parent_user_id);
        }

        // If user is owner, include all sub-users' projects
        if (user.role === 'owner' && !user.parent_user_id) {
            const allUsers = await database.loadData<any>('users');
            const subUserIds = allUsers
                ?.filter(u => u.parent_user_id === user.id)
                .map(u => u.id) || [];
            
            if (subUserIds.length > 0) {
                accessibleUserIds.push(...subUserIds);
                console.log('👑 Owner - including', subUserIds.length, 'sub-users projects');
            }
        }

        console.log('🔑 Accessible user IDs:', accessibleUserIds);

        // Filter projects by accessible user IDs
        const projects = allProjects.filter(p => p.user_id && accessibleUserIds.includes(p.user_id));
        
        console.log('✅ Found', projects.length, 'accessible projects out of', allProjects.length, 'total');

        return projects;
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
        
        if (!project) {
            return null;
        }

        // Get list of user IDs that this user can access projects from
        const accessibleUserIds: string[] = [user.id];

        // If user is a member (sub-user), also include parent's projects
        if (user.parent_user_id) {
            accessibleUserIds.push(user.parent_user_id);
        }

        // If user is owner, include all sub-users' projects
        if (user.role === 'owner' && !user.parent_user_id) {
            const allUsers = await database.loadData<any>('users');
            const subUserIds = allUsers
                ?.filter(u => u.parent_user_id === user.id)
                .map(u => u.id) || [];
            
            if (subUserIds.length > 0) {
                accessibleUserIds.push(...subUserIds);
            }
        }

        // Verify the project belongs to an accessible user
        if (!project.user_id || !accessibleUserIds.includes(project.user_id)) {
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

        // Get the existing project
        const existingProject = await database.loadDataById<Project>(TABLES.PROJECTS, id);
        if (!existingProject) {
            throw new Error('Project not found');
        }

        // Get list of user IDs that this user can access projects from
        const accessibleUserIds: string[] = [user.id];

        // If user is a member (sub-user), also include parent's projects
        if (user.parent_user_id) {
            accessibleUserIds.push(user.parent_user_id);
        }

        // If user is owner, include all sub-users' projects
        if (user.role === 'owner' && !user.parent_user_id) {
            const allUsers = await database.loadData<any>('users');
            const subUserIds = allUsers
                ?.filter(u => u.parent_user_id === user.id)
                .map(u => u.id) || [];
            
            if (subUserIds.length > 0) {
                accessibleUserIds.push(...subUserIds);
            }
        }

        // Verify the project belongs to an accessible user
        if (!existingProject.user_id || !accessibleUserIds.includes(existingProject.user_id)) {
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

        // Get the existing project
        const existingProject = await database.loadDataById<Project>(TABLES.PROJECTS, id);
        if (!existingProject) {
            throw new Error('Project not found');
        }

        // Get list of user IDs that this user can access projects from
        const accessibleUserIds: string[] = [user.id];

        // If user is a member (sub-user), also include parent's projects
        if (user.parent_user_id) {
            accessibleUserIds.push(user.parent_user_id);
        }

        // If user is owner, include all sub-users' projects
        if (user.role === 'owner' && !user.parent_user_id) {
            const allUsers = await database.loadData<any>('users');
            const subUserIds = allUsers
                ?.filter(u => u.parent_user_id === user.id)
                .map(u => u.id) || [];
            
            if (subUserIds.length > 0) {
                accessibleUserIds.push(...subUserIds);
            }
        }

        // Verify the project belongs to an accessible user
        if (!existingProject.user_id || !accessibleUserIds.includes(existingProject.user_id)) {
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