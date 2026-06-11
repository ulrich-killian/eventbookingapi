import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { createBooking, listUserBookings, cancelBooking } from '../services/booking.service.js';

const router = express.Router();

/**
 * @openapi
 * /events/{id}/book:
 *   post:
 *     summary: Book an event
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seats:
 *                 type: integer
 *                 example: 1
 *                 default: 1
 *     responses:
 *       201:
 *         description: Booking successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 booking:
 *                   type: object
 *       404:
 *         description: Event not found
 *       409:
 *         description: Not enough seats / Event fully booked
 *       500:
 *         description: Booking failed
 */
router.post('/events/:id/book', authenticateToken, async (req, res) => {
    try {
        const { seats } = req.body;
        const booking = await createBooking(req.params.id, req.user.id, seats || 1);
        res.status(201).json({ message: "Booking successful", booking });
    } catch (err) {
        if (err.message === 'NOT_ENOUGH_SEATS') {
            return res.status(409).json({ error: "Sorry, this event is fully booked." });
        }
        if (err.message === 'EVENT_NOT_FOUND') {
            return res.status(404).json({ error: "Event not found." });
        }
        console.error("Booking Error:", err);
        res.status(500).json({ error: "Booking failed" });
    }
});

/**
 * @openapi
 * /bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Failed to fetch bookings
 */
router.get('/bookings', authenticateToken, async (req, res) => {
    try {
        const bookings = await listUserBookings(req.user.id);
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch bookings", err });
    }
});

/**
 * @openapi
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags:
 *       - Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       403:
 *         description: Booking not found or unauthorized
 *       500:
 *         description: Failed to cancel booking
 */
router.delete('/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const result = await cancelBooking(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        if (err.message === 'BOOKING_NOT_FOUND_OR_UNAUTHORIZED') {
            return res.status(403).json({ error: "Booking not found or you are not authorized to cancel it." });
        }
        console.error("Cancel Booking Error:", err);
        res.status(500).json({ error: "Failed to cancel booking" });
    }
});

export default router;