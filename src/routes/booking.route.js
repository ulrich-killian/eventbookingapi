import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { createBooking, listUserBookings } from '../services/booking.service.js';

const router = express.Router();

router.post('/events/:id/book', authenticateToken, async (req, res) => {
    try {
        const { seats } = req.body;
        const booking = await createBooking(req.params.id, req.user.id, seats || 1);
        res.status(201).json({ message: "Booking successful", booking });
    } catch (err) {
        const status = err.message === 'NOT_ENOUGH_SEATS' ? 409 : 500;
        res.status(status).json({ error: err.message });
    }
});

router.get('/bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await listUserBookings(req.user.id);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch bookings", err });
    }
});

export default router;