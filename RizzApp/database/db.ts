import * as SQLite from 'expo-sqlite';
import { SQLResult } from './types';

declare module 'expo-sqlite' {
  interface SQLiteDatabase {
    execAsync(query: string): Promise<SQLResult>;
  }
}

let db: SQLite.SQLiteDatabase;
let isInitialized = false;

export const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabaseSync('rizzapp.db');
  }
  return db;
};

export const initDB = async (): Promise<boolean> => {
  try {
    const database = getDatabase();
    
    await database.execAsync(
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        client TEXT NOT NULL,
        budget REAL NOT NULL,
        progress INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        description TEXT NOT NULL,
        cost REAL NOT NULL,
        date TEXT NOT NULL
      );`
    );
    
    console.log('Database initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.log('DB init error:', error);
    return false;
  }
};

export const ensureDBInitialized = async () => {
  if (!isInitialized) {
    await initDB();
  }
};

export default getDatabase;
