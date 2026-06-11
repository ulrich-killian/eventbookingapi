import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg; 

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function testConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("postgres db connected successfully");
   } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
}

export { pool, testConnection };