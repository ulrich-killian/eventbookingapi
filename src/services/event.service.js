import { pool } from '../schema/db.js';

export const createNewEvent = async (eventData, ownerId) => {
    const { title, description, date, total_seats } = eventData;

    if (!Number.isInteger(total_seats) || total_seats <= 0) {
        throw new Error('INVALID_TOTAL_SEATS');
    }

    if (new Date(date) <= new Date()) {
        throw new Error('EVENT_DATE_PAST');
    }

    const query = `
        INSERT INTO events (title, description, event_date, total_seats, available_seats, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;

    const values = [title, description, date, total_seats, total_seats, ownerId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getFilteredEvents = async (startDate, endDate, limit = 10, offset = 0) => {

   const start = startDate || new Date().toISOString();
   const end = endDate || '2099-12-31'; 

   const query = `
       SELECT e.*, u.username as creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.event_date BETWEEN $1 AND $2
       ORDER BY e.event_date ASC
       LIMIT $3 OFFSET $4;
   `;

   const values = [start, end, limit, offset];
   const result = await pool.query(query, values);
   return result.rows;
};

export const getEventWithSummary = async (eventId) => {
   const query = `
       SELECT 
           e.*, 
           u.username as creator_name,
           COALESCE(SUM(b.seats_booked), 0) AS total_booked_seats,
           (e.total_seats - COALESCE(SUM(b.seats_booked), 0)) AS real_time_available
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN bookings b ON e.id = b.event_id
       WHERE e.id = $1
       GROUP BY e.id, u.username;
   `;

   const result = await pool.query(query, [eventId]);
   return result.rows[0];
};


export const updateEventDetails = async (eventId, ownerId, updateData) => {
   const currentEvent = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
   if (currentEvent.rowCount === 0) throw new Error('NOT_OWNER_OR_NOT_FOUND');

   const title = updateData.title || currentEvent.rows[0].title;
   const description = updateData.description || currentEvent.rows[0].description;
   const date = updateData.date || currentEvent.rows[0].event_date;
   const total_seats = updateData.total_seats !== undefined ? updateData.total_seats : currentEvent.rows[0].total_seats;


   if (!Number.isInteger(total_seats) || total_seats <= 0) {
    throw new Error('INVALID_TOTAL_SEATS');
}

   const countQuery = `SELECT COALESCE(SUM(seats_booked), 0) AS booked FROM bookings WHERE event_id = $1`;
   const countRes = await pool.query(countQuery, [eventId]);
   const currentlyBooked = parseInt(countRes.rows[0].booked);

   if (total_seats < currentlyBooked) {
       throw new Error('CANNOT_REDUCE_BELOW_BOOKED');
   }


   const updateQuery = `
    UPDATE events 
    SET title = $1, 
        description = $2, 
        event_date = $3, 
        total_seats = $4::integer, 
        available_seats = ($4::integer - $5::integer)
    WHERE id = $6 AND created_by = $7
    RETURNING *;
`;

   const values = [title, description, date, total_seats, currentlyBooked, eventId, ownerId];
   const result = await pool.query(updateQuery, values);
   
   if (result.rowCount === 0) {
       throw new Error('NOT_OWNER_OR_NOT_FOUND');
   }

   return result.rows[0];
};

export const deleteEventSafely = async (eventId, ownerId) => {
   const bookingCheck = await pool.query(
       'SELECT COUNT(*) FROM bookings WHERE event_id = $1',
       [eventId]
   );

   const hasBookings = parseInt(bookingCheck.rows[0].count) > 0;

   if (hasBookings) {
       throw new Error('HAS_ACTIVE_BOOKINGS');
   }

   const result = await pool.query(
       'DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING *',
       [eventId, ownerId]
   );

   if (result.rowCount === 0) {
       throw new Error('NOT_OWNER_OR_NOT_FOUND');
   }

   return result.rows[0];
};