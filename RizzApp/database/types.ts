export interface Project {

  id?: string;export interface Project {

  name: string;  id?: string;

  client: string;  name: string;

  budget: number;  client: string;

  progress: number;  budget: number;

  date: string;  progress: number;

}  date: string;

}

export interface Expense {

  id?: string;export interface Expense {

  projectId: string;  id?: string;

  description: string;  projectId: string;

  cost: number;  description: string;

  date: string;  cost: number;

}  date: string;
}
  }
}