import express from 'express';
import { signup, loginUser } from '../services/auth.service.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing fields" });
        }
        const response = await signup(username, email, password);
        return res.status(201).json(response);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: "Email already exists" });
        }
        console.error("Signup Error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }
        const token = await loginUser(email, password);
        if (!token) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        return res.json({ token });
    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ error: "Server Error" });
    }
});

export default router;