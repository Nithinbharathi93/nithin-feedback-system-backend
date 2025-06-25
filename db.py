import sqlite3

DB_NAME = "database.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )
    """)

    c.execute("SELECT COUNT(*) FROM teams")
    if c.fetchone()[0] == 0:
        c.executemany("INSERT INTO teams (name) VALUES (?)", [('dev',), ('ops',), ('sec',), ('spt',)])
        print("✅ Default teams inserted")

    c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT,
        passwordHash TEXT,
        role TEXT CHECK(role IN ('manager', 'employee')) NOT NULL,
        teamId INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teamId) REFERENCES teams(id)
    )
    """)

    c.execute("""
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER NOT NULL,
        managerId INTEGER NOT NULL,
        strengths TEXT,
        improvements TEXT,
        sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative')) NOT NULL,
        acknowledged BOOLEAN DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employeeId) REFERENCES users(id),
        FOREIGN KEY (managerId) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()
    print("✅ SQLite DB initialized")

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn