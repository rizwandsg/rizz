// database/db.ts
import SQLite from "expo-sqlite"; // default import!

const db = SQLite.openDatabase("rizzapp.db");

export const initDB = () => {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        client TEXT NOT NULL,
        budget REAL NOT NULL,
        progress INTEGER NOT NULL
      );`
    );
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        projectId TEXT NOT NULL,
        description TEXT NOT NULL,
        cost REAL NOT NULL,
        date TEXT NOT NULL
      );`
    );
  }, err => console.log("DB init error:", err));
};

export default db;
