// database/projectOperations.ts
import { ensureDBInitialized, getDatabase } from './db';

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
}

export const getAllProjects = async (): Promise<Project[]> => {
  await ensureDBInitialized();
  const db = getDatabase();
  
  try {
    const projects = await db.getAllAsync<Project>(
      'SELECT * FROM projects ORDER BY name;'
    );
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
};

export const addProject = async (project: Omit<Project, 'id'>): Promise<boolean> => {
  await ensureDBInitialized();
  const db = getDatabase();
  
  try {
    const id = Math.random().toString(36).substring(7);
    await db.runAsync(
      'INSERT INTO projects (id, name, client, budget, progress) VALUES (?, ?, ?, ?, ?);',
      [id, project.name, project.client, project.budget, project.progress]
    );
    return true;
  } catch (error) {
    console.error('Error adding project:', error);
    return false;
  }
};