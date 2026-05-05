import { pool } from '../schema/db.js';

const assertFutureEventDate = (value) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        throw new Error('INVALID_EVENT_DATE');
    }

    if (parsed <= new Date()) {
        throw new Error('EVENT_DATE_PAST');
    }
    return parsed.toISOString();
};

export const createNewEvent = async (eventData, ownerId) => {
    const { title, description, date, total_seats } = eventData;


    if (!Number.isInteger(total_seats) || total_seats <= 0) {
        throw new Error('INVALID_TOTAL_SEATS');
    }

    const normalizedDate = assertFutureEventDate(date);


    const query = `
        INSERT INTO events (title, description, event_date, total_seats, available_seats, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
    `;

    const values = [title, description, normalizedDate, total_seats, total_seats, ownerId];
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
   const client = await pool.connect();
   try {
       await client.query('BEGIN');


       const eventCheck = await client.query(
           'SELECT * FROM events WHERE id = $1 AND created_by = $2 FOR UPDATE', 
           [eventId, ownerId]
       );
       
       if (eventCheck.rowCount === 0) {
           throw new Error('NOT_OWNER_OR_NOT_FOUND');
       }

       const currentEvent = eventCheck.rows[0];

       const date = updateData.date 
           ? assertFutureEventDate(updateData.date) 
           : currentEvent.event_date;


       const title = updateData.title || currentEvent.title;
       const description = updateData.description || currentEvent.description;
       const total_seats = updateData.total_seats !== undefined ? updateData.total_seats : currentEvent.total_seats;


       if (!Number.isInteger(total_seats) || total_seats <= 0) {
           throw new Error('INVALID_TOTAL_SEATS');
       }


       const countQuery = `SELECT COALESCE(SUM(seats_booked), 0) AS booked FROM bookings WHERE event_id = $1`;
       const countRes = await client.query(countQuery, [eventId]);
       const currentlyBooked = parseInt(countRes.rows[0].booked);

       if (total_seats < currentlyBooked) {
           throw new Error('CANNOT_REDUCE_BELOW_BOOKED');
       }


       const updateQuery = `
           UPDATE events 
           SET title = $1, description = $2, event_date = $3, 
               total_seats = $4::integer, available_seats = ($4::integer - $5::integer)
           WHERE id = $6 AND created_by = $7
           RETURNING *;
       `;

       const values = [title, description, date, total_seats, currentlyBooked, eventId, ownerId];
       const result = await client.query(updateQuery, values);
       
       await client.query('COMMIT');
       return result.rows[0];

   } catch (error) {
       await client.query('ROLLBACK');
       throw error;
   } finally {
       client.release();
   }
};

export const deleteEventSafely = async (eventId, ownerId) => {

    const deleteQuery = `
    DELETE FROM events 
    WHERE id = $1 
    AND created_by = $2 
    AND NOT EXISTS (SELECT 1 FROM bookings WHERE event_id = $1)
    RETURNING id;
`;

   const result = await pool.query(deleteQuery, [eventId, ownerId]);

   if (result.rowCount === 0) {
    const checkRes = await pool.query(
        'SELECT (SELECT COUNT(*) FROM bookings WHERE event_id = $1) as booking_count FROM events WHERE id = $2',
        [eventId, eventId]
    );

    if (checkRes.rowCount === 0) throw new Error('NOT_OWNER_OR_NOT_FOUND');
    if (parseInt(checkRes.rows[0].booking_count) > 0) throw new Error('HAS_ACTIVE_BOOKINGS');
   }
   return { message: "Event deleted successfully" };
};