import express from 'express';
import { signup, loginUser } from '../services/auth.service.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });
        const newUser = await signup(username, email, password);
        res.status(201).json(newUser);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: "Email already exists" });
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post('/login', async (req, res) => {
    try {
        const token = await loginUser(req.body.email, req.body.password);
        if (!token) return res.status(401).json({ error: "Invalid credentials" });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Server Error", err });
    }
});

export default router;