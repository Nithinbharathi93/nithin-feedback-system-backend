import mysql from "mysql2/promise";

async function waitForDatabase(config, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await mysql.createConnection(config);
      console.log("✅ Connected to MySQL");
      return connection;
    } catch (err) {
      console.log(`⏳ MySQL not ready yet... retrying in ${delay}ms (${i + 1}/${retries})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error("❌ Failed to connect to MySQL after multiple attempts.");
}

export async function initDatabase() {
  const connection = await waitForDatabase({
    host: "db",
    user: "root",
    password: "nithin",
    database: "feedbackdb",
  });
  return connection;
}
