import { createNewEvent, getFilteredEvents, getEventWithSummary, updateEventDetails, deleteEventSafely } from '../services/event.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();


router.get('/events/:id', async (req, res) => {
   try {
       const event = await getEventWithSummary(req.params.id);

       if (!event) {
           return res.status(404).json({ error: "Event not found." });
       }

       res.status(200).json(event);
   } catch (err) {
       res.status(500).json({ error: "Server error fetching event details.", err });
   }
});

router.get('/events', async (req, res) => {
   try {
       const { start, end, limit, offset } = req.query;
       
       const events = await getFilteredEvents( 
           start, 
           end, 
           parseInt(limit) || 10, 
           parseInt(offset) || 0
       );

       res.status(200).json({
           count: events.length,
           events
       });
   } catch (err) {
       res.status(500).json({ error: "Failed to fetch events.", err });
   }
});


router.delete('/events/:id', authenticateToken, async (req, res) => {
   try {
       await deleteEventSafely(req.params.id, req.user.id);
       
       res.status(200).json({
           message: "Event deleted successfully."
       });
   } catch (error) {
      console.error("DEBUG ERROR:", error);
       if (error.message === 'HAS_ACTIVE_BOOKINGS') {
           return res.status(400).json({ 
               error: "Cannot delete event with active bookings. Please contact attendees or cancel bookings first." 
           });
       }
       if (error.message === 'NOT_OWNER_OR_NOT_FOUND') {
           return res.status(403).json({ error: "You are not authorized to delete this event." });
       }
       res.status(500).json({ error: "Server error during deletion." });
   }
});


router.put('/events/:id', authenticateToken, async (req, res) => {
   try {
       const updatedEvent = await updateEventDetails(req.params.id, req.user.id, req.body);
       
       res.status(200).json({
           message: "Event updated successfully",
           event: updatedEvent
       });
   } catch (error) {
       if (error.message === 'CANNOT_REDUCE_BELOW_BOOKED') {
           return res.status(409).json({ error: "Cannot reduce total seats below current bookings." });
       }
       if (error.message === 'NOT_OWNER_OR_NOT_FOUND') {
           return res.status(403).json({ error: "You are not authorized to edit this event." });
       }
       res.status(500).json({ error: "Server error during update." });
   }
});

router.post('/events', authenticateToken, async (req, res) => {
    try {
        const event = await createNewEvent(req.body, req.user.id);
        
        res.status(201).json({
            message: "Event created successfully",
            event
        });
    } catch (error) {
        if (error.message === 'EVENT_DATE_PAST') {
            return res.status(400).json({ error: "Event date must be in the future." });
        }
        res.status(500).json({ error: "Server error while creating event." });
    }
});

export default router;