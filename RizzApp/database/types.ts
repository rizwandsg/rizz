export interface Project {
  id?: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
  date: string;
}

export interface Expense {
  id?: string;
  projectId: string;
  description: string;
  cost: number;
  date: string;
}