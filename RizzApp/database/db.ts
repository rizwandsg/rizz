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
  try {
    if (!db) {
      console.log('Opening database connection...');
      db = SQLite.openDatabase('rizzapp.db');
      console.log('Database connection opened successfully');
    }
    return db;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

export const initDB = async (): Promise<boolean> => {
  try {
    console.log('Initializing database...');
    const database = getDatabase();
    
    // First, drop the existing tables to start fresh
    console.log('Dropping existing tables...');
    const dropQueries = [
      'DROP TABLE IF EXISTS expenses;',
      'DROP TABLE IF EXISTS projects;'
    ];
    
    for (const query of dropQueries) {
      try {
        await database.execAsync(query);
      } catch (dropError) {
        console.error('Error dropping table:', dropError);
      }
    }
    
    // Create the projects table with all required columns
    console.log('Creating projects table...');
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        client TEXT NOT NULL,
        budget REAL NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        date TEXT NOT NULL DEFAULT (date('now'))
      );
    `;
    
    await database.execAsync(createProjectsTable);
    
    // Create the expenses table
    console.log('Creating expenses table...');
    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        description TEXT NOT NULL,
        cost REAL NOT NULL,
        date TEXT NOT NULL DEFAULT (date('now')),
        FOREIGN KEY (projectId) REFERENCES projects(id)
      );
    `;
    
    await database.execAsync(createExpensesTable);

    // Verify the tables were created
    console.log('Verifying database structure...');
    const tables = await database.execAsync(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );
    console.log('Created tables:', JSON.stringify(tables, null, 2));

    if (!tables?.[0] || !tables[0].some((t: any) => t.name === 'projects')) {
      throw new Error('Failed to create projects table');
    }

    // Insert a test project to verify everything works
    try {
      const testId = 'test-' + Date.now();
      await database.execAsync(`
        INSERT INTO projects (id, name, client, budget, progress, date)
        VALUES ('${testId}', 'Test Project', 'Test Client', 100, 0, date('now'));
      `);
      
      const testResult = await database.execAsync(
        `SELECT * FROM projects WHERE id = '${testId}';`
      );
      console.log('Test project inserted:', JSON.stringify(testResult, null, 2));
      
      // Clean up test data
      await database.execAsync(`DELETE FROM projects WHERE id = '${testId}';`);
    } catch (testError) {
      console.error('Error during test insert:', testError);
      throw new Error('Database write test failed');
    }

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
