import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg; 

const pool = new Pool(
  process.env.DATABASE_URL
    ? { 
        connectionString: process.env.DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
      }
    : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
      }
);

async function testConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("postgres db connected successfully");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

export { pool, testConnection };