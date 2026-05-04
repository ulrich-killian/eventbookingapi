import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../schema/db.js'

export  const signup = async (username, email, password) => {
   const salt = 10;
   const passwordHash = await bcrypt.hash(password, salt);


const query = `
INSERT INTO users (username, email, password_hash) 
VALUES ($1, $2, $3) 
RETURNING id, username, email;
`;
const result = await pool.query(query, [username, email, passwordHash]);
    return result.rows[0];
};

export const loginUser = async (email, password) => {
   const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
   const user = result.rows[0];

   if (!user) return null;

   const isMatch = await bcrypt.compare(password, user.password_hash);
   if (!isMatch) return null;


   return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};
