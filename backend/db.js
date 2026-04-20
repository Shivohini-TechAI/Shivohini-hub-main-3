import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// ✅ Create Pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:nachiket@localhost:5434/mydb',

  // ✅ IMPORTANT for VPS / production (SSL)
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// ✅ Test DB connection (VERY IMPORTANT)
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL Connected');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
  });

// ✅ Safe query function
export const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('❌ Query Error:', err.message);
    throw err;
  }
};

export default pool;

console.log("👉 CONNECTING TO:", process.env.DATABASE_URL);