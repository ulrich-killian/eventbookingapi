import { signup, loginUser } from '../services/auth.service.js'

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  const result = await signup(username, email, password);
  res.status(201).json({ token: result.token, user: result.user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const token = await loginUser(email, password);     
  if (!token) return res.status(401).json({ error: "Invalid credentials" });
  res.json({ token });
};