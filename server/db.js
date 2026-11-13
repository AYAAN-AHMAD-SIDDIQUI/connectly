
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Load environment variables from server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, ".env")
});

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  ssl: {
    rejectUnauthorized: false
  },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Handle unexpected database errors
pool.on("error", (error) => {
  console.error("PostgreSQL pool error:", error);
});

// Reusable SQL query function
export const query = (text, params) => {
  return pool.query(text, params);
};

// Test database connection
export const testDatabase = async () => {
  const result = await pool.query("SELECT NOW()");

  console.log("PostgreSQL connected successfully!");
  console.log("Database time:", result.rows[0].now);
};

export default pool;
