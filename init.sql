import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function initDatabase() {
  const db = await open({
    filename: "./database.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  const { count } = await db.get("SELECT COUNT(*) as count FROM teams");
  if (count === 0) {
    await db.exec(`
      INSERT INTO teams (name) VALUES 
      ('dev'), ('ops'), ('sec'), ('spt');
    `);
    console.log("✅ Inserted default teams");
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      passwordHash TEXT,
      role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
      teamId INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teamId) REFERENCES teams(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeId INTEGER NOT NULL,
      managerId INTEGER NOT NULL,
      strengths TEXT,
      improvements TEXT,
      sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
      acknowledged BOOLEAN DEFAULT 0,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeId) REFERENCES users(id),
      FOREIGN KEY (managerId) REFERENCES users(id)
    );
  `);

  console.log("✅ SQLite database and tables ready");
  return db;
}
