import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('📊 Executed query:', { text, duration, rows: res.rowCount });
  return res;
}

export async function connectDB() {
  try {
    await pool.connect();
    console.log('✅ Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}
