import { Pool } from "pg";

// One shared connection pool for the whole app.
// All settings come from environment variables (same image, any environment).
export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "todo",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "tododb",
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The DB container can take a few seconds to accept connections.
// Retrying is the simplest way to show "services start in any order".
export async function connectWithRetry(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Connected to PostgreSQL");
      return;
    } catch (err) {
      console.log(`⏳ Waiting for database (${attempt}/${retries})...`);
      if (attempt === retries) throw err;
      await sleep(delayMs);
    }
  }
}

// Create tables on first start (idempotent).
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS todos (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title      TEXT NOT NULL,
      completed  BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Todos belong to a user (added later, so existing databases are upgraded too)
    ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  `);
}
