import express from 'express';
import { signup, loginUser } from '../services/auth.service.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const response = await signup(username, email, password);
        if (!username || !email || !password)
             return res.status(401).json({ error: "Missing fields" });
        res.status(201).json(response);
    } catch (err) {
        if (err.code === '23505') 
        return res.status(401).json({ error: "Email already exists" });
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