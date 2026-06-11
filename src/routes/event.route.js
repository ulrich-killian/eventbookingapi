import {
  createNewEvent,
  getFilteredEvents,
  getEventWithSummary,
  updateEventDetails,
  deleteEventSafely,
} from "../services/event.service.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import express from "express";

const router = express.Router();

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get event details with booking summary
 *     tags:
 *       - Events
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details retrieved
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
router.get("/events/:id", async (req, res) => {
  try {
    const event = await getEventWithSummary(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }
    res.status(200).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching event details." });
  }
});

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List all events with optional filters
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Failed to fetch events
 */
router.get("/events", async (req, res) => {
  try {
    const { start, end, limit, offset } = req.query;
    const events = await getFilteredEvents(
      start,
      end,
      parseInt(limit) || 10,
      parseInt(offset) || 0
    );
    res.status(200).json({ count: events.length, events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events." });
  }
});

/**
 * @openapi
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (owner only)
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Cannot delete event with active bookings
 *       403:
 *         description: Not owner or event not found
 *       500:
 *         description: Server error
 */
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    await deleteEventSafely(req.params.id, req.user.id);
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    if (error.message === 'HAS_ACTIVE_BOOKINGS') {
      return res.status(400).json({ error: "Cannot delete an event that has active bookings." });
    }
    if (error.message === 'NOT_OWNER_OR_NOT_FOUND') {
      return res.status(403).json({ error: "Event not found or permission denied." });
    }
    console.error("Delete Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @openapi
 * /events/{id}:
 *   put:
 *     summary: Update event details (owner only)
 *     tags:
 *       - Events
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               total_seats:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid date format or total seats
 *       403:
 *         description: Not authorized
 *       409:
 *         description: Cannot reduce seats below bookings
 *       500:
 *         description: Server error
 */
router.put("/events/:id", authenticateToken, async (req, res) => {
  try {
    const updatedEvent = await updateEventDetails(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    if (error.message === "CANNOT_REDUCE_BELOW_BOOKED") {
      return res.status(409).json({ error: "Cannot reduce total seats below current bookings." });
    }
    if (error.message === 'INVALID_EVENT_DATE') {
      return res.status(400).json({ error: "Please provide a valid date format." });
    }
    if (error.message === 'INVALID_TOTAL_SEATS') {
      return res.status(400).json({ error: "Total seats must be a positive integer." });
    }
    if (error.message === "NOT_OWNER_OR_NOT_FOUND") {
      return res.status(403).json({ error: "You are not authorized to edit this event." });
    }
    res.status(500).json({ error: "Server error during update." });
  }
});

/**
 * @openapi
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags:
 *       - Events
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - location
 *               - total_seats
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Tech Conference 2024"
 *               description:
 *                 type: string
 *                 example: "Annual tech meetup"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-25T10:00:00Z"
 *               location:
 *                 type: string
 *                 example: "Lagos, Nigeria"
 *               total_seats:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid date, past date, or invalid seats
 *       500:
 *         description: Server error
 */
router.post("/events", authenticateToken, async (req, res) => {
  try {
    const event = await createNewEvent(req.body, req.user.id);
    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    if (error.message === 'INVALID_EVENT_DATE') {
      return res.status(400).json({ error: "Please provide a valid date format." });
    }
    if (error.message === "EVENT_DATE_PAST") {
      return res.status(400).json({ error: "Event date must be in the future." });
    }
    if (error.message === 'INVALID_TOTAL_SEATS') {
      return res.status(400).json({ error: "Total seats must be a positive integer." });
    }
    res.status(500).json({ error: "Server error while creating event." });
  }
});

export default router;