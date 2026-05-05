import { pool } from '../schema/db.js';

export const createBooking = async (eventId, userId, seatsBooked) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const eventRes = await client.query(
            'SELECT available_seats FROM events WHERE id = $1 FOR UPDATE',
            [eventId]
        );

        if (eventRes.rowCount === 0) throw new Error('EVENT_NOT_FOUND');
        
        const available = eventRes.rows[0].available_seats;
        if (available < seatsBooked) throw new Error('NOT_ENOUGH_SEATS');

        const bookingQuery = `
            INSERT INTO bookings (user_id, event_id, seats_booked)
            VALUES ($1, $2, $3) RETURNING *`;
        const bookingRes = await client.query(bookingQuery, [userId, eventId, seatsBooked]);

        await client.query(
            'UPDATE events SET available_seats = available_seats - $1 WHERE id = $2',
            [seatsBooked, eventId]
        );

        await client.query('COMMIT');
        return bookingRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const listUserBookings = async (userId) => {
    const query = `
        SELECT b.*, e.title, e.event_date 
        FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.user_id = $1`;
    const res = await pool.query(query, [userId]);
    return res.rows;
};

export const cancelBooking = async (bookingId, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');


        const bookingRes = await client.query(
            'SELECT event_id, seats_booked FROM bookings WHERE id = $1 AND user_id = $2 FOR UPDATE',
            [bookingId, userId]
        );

        if (bookingRes.rowCount === 0) {
            throw new Error('BOOKING_NOT_FOUND_OR_UNAUTHORIZED');
        }

        const { event_id, seats_booked } = bookingRes.rows[0];


        await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

 
        await client.query(
            'UPDATE events SET available_seats = available_seats + $1 WHERE id = $2',
            [seats_booked, event_id]
        );

        await client.query('COMMIT');
        return { message: "Booking cancelled successfully" };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};