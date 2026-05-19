import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database.");
    await client.query('ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS tip_included BOOLEAN DEFAULT FALSE;');
    console.log("Column 'tip_included' added to 'tables'.");
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await client.end();
  }
}

run();
