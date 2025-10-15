import * as SQLite from 'expo-sqlite';
import { SQLResult } from './types';

declare module 'expo-sqlite' {
  interface SQLiteDatabase {
    execAsync(query: string): Promise<SQLResult>;
  }
}

let db: SQLite.SQLiteDatabase | undefined;
let isInitialized = false;

const openDatabase = () => {
  try {
    console.log('Opening database connection...');
    const database = SQLite.openDatabaseSync('rizzapp.db');
    if (!database) {
      throw new Error('Failed to open database');
    }
    return database;
  } catch (error) {
    console.error('Database open error:', error);
    throw new Error(
      `Failed to open database: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export const getDatabase = () => {
  try {
    // If we already have a connection, return it
    if (db) {
      return db;
    }

    // Try to open a new connection
    db = openDatabase();
    
    if (!db) {
      throw new Error('Database connection failed');
    }

    console.log('Database connection established');
    return db;
  } catch (error) {
    console.error('getDatabase error:', error);
    throw error;
  }
};

export const initDB = async (): Promise<boolean> => {
  try {
    console.log('Initializing database...');
    const database = getDatabase();
    
    if (!database) {
      throw new Error('Failed to get database connection');
    }

    // Basic database check
    try {
      await database.execAsync('PRAGMA journal_mode=WAL;');
      console.log('Database mode set to WAL');
    } catch (error) {
      const pragmaError = error as Error;
      console.warn('Could not set journal mode:', pragmaError.message);
    }

    // Step 1: Create projects table with minimal structure
    console.log('Step 1: Creating projects table...');
    try {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT,
          client TEXT,
          budget REAL,
          progress INTEGER DEFAULT 0,
          date TEXT DEFAULT (date('now'))
        );
      `);
    } catch (error) {
      const createError = error as Error;
      console.error('Error creating projects table:', createError.message);
      throw new Error('Failed to create projects table');
    }

    // Step 2: Verify projects table exists
    console.log('Step 2: Verifying projects table...');
    try {
      // First check if table exists in sqlite_master
      const tableCheck = await database.execAsync(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='projects';"
      );
      console.log('Table check in sqlite_master:', JSON.stringify(tableCheck, null, 2));

      if (!tableCheck || !tableCheck[0] || tableCheck[0].length === 0) {
        console.error('Projects table not found in sqlite_master');
        throw new Error('Projects table not found in database schema');
      }

      // Try to get table info
      const tableInfo = await database.execAsync('PRAGMA table_info(projects);');
      console.log('Table structure:', JSON.stringify(tableInfo, null, 2));

      if (!tableInfo || !tableInfo[0] || tableInfo[0].length === 0) {
        console.error('Could not get table structure');
        throw new Error('Could not verify table structure');
      }

      // Verify we can query the table
      const countCheck = await database.execAsync('SELECT COUNT(*) as count FROM projects;');
      console.log('Table query test:', JSON.stringify(countCheck, null, 2));

    } catch (error) {
      const verifyError = error as Error;
      console.error('Error during table verification:', verifyError.message);
      console.error('Error details:', verifyError);
      throw new Error(`Failed to verify table creation: ${verifyError.message}`);
    }

    // Step 3: Try a simple insert
    console.log('Step 3: Testing table with insert...');
    const testId = 'test-' + Date.now();
    try {
      await database.execAsync(`
        INSERT INTO projects (id, name, client, budget) 
        VALUES ('${testId}', 'Test Project', 'Test Client', 100);
      `);
      
      const checkResult = await database.execAsync(
        `SELECT * FROM projects WHERE id = '${testId}';`
      );
      console.log('Test insert result:', JSON.stringify(checkResult, null, 2));

      await database.execAsync(`DELETE FROM projects WHERE id = '${testId}';`);
      console.log('Test cleanup completed');
    } catch (error) {
      const testError = error as Error;
      console.error('Insert test failed:', testError.message);
      throw new Error('Database write test failed');
    }

    console.log('Database initialization successful');
    isInitialized = true;
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Database initialization failed:', errorMessage);
    isInitialized = false;
    db = undefined;
    throw error;
  }
};

export const ensureDBInitialized = async () => {
  if (!isInitialized) {
    await initDB();
  }
};

export default getDatabase;
