import 'react-native-get-random-values'; // Ensure compatibility with React Native
import { v4 as uuidv4 } from 'uuid';
import projectStorage from '../services/projectStorage';
import { Project } from './types';

// Validate project payload
const validateProject = (project: Partial<Project>): void => {
    if (!project.name || typeof project.name !== 'string' || project.name.trim() === '') {
        throw new Error('Project name is required');
    }
    if (!project.client || typeof project.client !== 'string' || project.client.trim() === '') {
        throw new Error('Client name is required');
    }
    if (typeof project.budget !== 'number' || isNaN(project.budget) || project.budget < 0) {
        throw new Error('Valid budget amount is required');
    }
};


export const getAllProjects = async (): Promise<Project[]> => {
    try {
        const projects = await projectStorage.loadProjects();
        return projects.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err) {
        console.error('Error getting projects:', err);
        throw new Error('Failed to fetch projects: ' + (err instanceof Error ? err.message : String(err)));
    }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
        const projects = await projectStorage.loadProjects();
        const project = projectStorage.findProjectById(projects, id);
        return project || null;
    } catch (err) {
        console.error('Error getting project:', err);
        throw new Error('Failed to get project: ' + (err instanceof Error ? err.message : String(err)));
    }
};

export const saveProject = async (project: Project): Promise<Project> => {
    try {
        validateProject(project);

        // Prepare the project data with defaults and trimmed values
        const projectData = {
            id: project.id || uuidv4(),
            name: project.name.trim(),
            client: project.client.trim(),
            budget: project.budget,
            progress: project.progress || 0,
            date: project.date || new Date().toISOString().split('T')[0]
        };

        // Load current projects
        const projects = await projectStorage.loadProjects();

        if (project.id) {
            // Update existing project
            const index = projects.findIndex(p => p.id === project.id);
            if (index === -1) {
                throw new Error('Project not found');
            }
            projects[index] = projectData;
        } else {
            // Add new project
            projects.push(projectData);
        }

        // Save updated projects list
        await projectStorage.saveProjects(projects);

        return projectData;
    } catch (err) {
        console.error('Error saving project:', err);
        throw new Error('Failed to save project: ' + (err instanceof Error ? err.message : String(err)));
    }
};

