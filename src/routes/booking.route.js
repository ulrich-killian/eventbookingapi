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
        if (err.message === 'NOT_ENOUGH_SEATS') {
            return res.status(409).json({ error: "Sorry, this event is fully booked." });
        }
        res.status(500).json({ error: "Booking failed" });
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