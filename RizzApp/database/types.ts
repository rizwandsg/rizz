import * as SQLite from 'expo-sqlite';

export type SQLResult = Record<string, any>[][];

export interface Project {
  id: string;
  name: string;
  client: string;
  budget: number;
  progress: number;
}

export interface Expense {
  id: string;
  projectId: string;
  description: string;
  cost: number;
  date: string;
}

declare global {
  namespace SQLite {
    interface SQLiteDatabase {
      execAsync(query: string): Promise<SQLResult>;
    }
  }
}