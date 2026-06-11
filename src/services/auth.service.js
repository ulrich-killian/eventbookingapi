import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../schema/db.js'

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is required");

export const signup = async (username, email, password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
    [username, email, passwordHash]
  );
  const user = result.rows[0];
  const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
  return { token, user };
};

export const loginUser = async (email, password) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  if (!user) return null;
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return null;
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
};