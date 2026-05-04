import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const developmentConfig =({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const pool = new Pool( developmentConfig );

async function testConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("postgres db connected succeffuly connected")
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
}

export { pool, testConnection };