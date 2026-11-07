import { createProject, getProjectById as getRemote, getProjects, updateProject, Project as RemoteProject } from '../api/projectsApi';
import { Project } from './types';

// Compatibility adapter for legacy consumers; the authenticated API owns persistence.
function legacy(project: RemoteProject): Project {
  return { id: project.id, name: project.name, client: project.client_name || '', budget: project.total_project_cost || 0, progress: 0, date: project.start_date };
}
export async function getAllProjects(): Promise<Project[]> { return (await getProjects()).map(legacy); }
export async function getProjectById(id: string): Promise<Project | null> { const result = await getRemote(id); return result ? legacy(result) : null; }
export async function saveProject(project: Project): Promise<Project> {
  const data = { name: project.name, client_name: project.client, total_project_cost: project.budget, start_date: project.date };
  return legacy(project.id ? await updateProject(project.id, data) : await createProject(data));
}
