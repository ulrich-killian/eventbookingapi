import request from 'supertest';
import app, { server } from '../server.js';
import { pool } from '../src/schema/db.js';
import jwt from 'jsonwebtoken';

const mockUser = { id: 1, username: 'testuser' };
const validToken = `Bearer ${jwt.sign(mockUser, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' })}`;
const invalidToken = 'Bearer completely-fake-bad-token';

let eventId;
let bookingId;

describe('Testing Your API With Jest and Supertest', () => {

  afterAll(async () => {
    await pool.end();
    server.close();
  });

  beforeEach(async () => {
    try {
      await pool.query('DELETE FROM bookings');
      await pool.query('DELETE FROM events');
      await pool.query('DELETE FROM users');

      await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE events_id_seq RESTART WITH 1');
      await pool.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');

      const userRes = await pool.query(
        `INSERT INTO users (username, email, password_hash) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (email) 
         DO UPDATE SET username = EXCLUDED.username 
         RETURNING id`,
        ['testuser', 'testuser@example.com', 'hashedpassword123']
      );
      const userId = userRes.rows[0].id;

      const eventRes = await pool.query(
        `INSERT INTO events (title, description, event_date, total_seats, available_seats, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        ['Test Concert', 'Fun times', new Date(Date.now() + 86400000), 100, 100, userId]
      );
      eventId = eventRes.rows[0].id;

      const res = await request(app)
        .post(`/api/events/${eventId}/book`)
        .set('Authorization', validToken)
        .send({ seats: 2 });

      if (res.body && res.body.booking) {
        bookingId = res.body.booking.id;
      }
    } catch (err) {
      console.error("Error in beforeEach setup:", err);
      throw err;
    }
  }, 10000);

  afterEach(async () => {
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users');
  });


  describe('POST /events/:id/book - API for booking an event', () => {
    it('should return 201 if token is valid and request is valid', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/book`)
        .set('Authorization', validToken)
        .send({ seats: 1 });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('message', 'Booking successful');
      expect(res.body).toHaveProperty('booking');
    });

    it('should return 401 if token is not found', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/book`)
        .send({ seats: 1 });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/book`)
        .set('Authorization', invalidToken)
        .send({ seats: 1 });

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if Event ID is not found', async () => {
      const nonExistentEventId = 999999;
      const res = await request(app)
        .post(`/api/events/${nonExistentEventId}/book`)
        .set('Authorization', validToken)
        .send({ seats: 1 });

      expect(res.statusCode).toEqual(404);
    });
  });


  describe('GET /bookings - API for getting user bookings', () => {
    it('should return 200 if token is valid', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', validToken);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
    });

    it('should return 401 if token not found', async () => {
      const res = await request(app).get('/api/bookings');

      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', invalidToken);

      expect(res.statusCode).toEqual(403);
    });
  });


  describe('DELETE /bookings/:id - API for cancelling a booking', () => {
    it('should return 200 if token is valid and ID is valid', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', validToken);

      expect(res.statusCode).toEqual(200);
    });

    it('should return 401 if token is not found', async () => {
      const res = await request(app).delete(`/api/bookings/${bookingId}`);

      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', invalidToken);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 403 if booking ID does not exist or unauthorized', async () => {
      const nonExistentBookingId = 999999;
      const res = await request(app)
        .delete(`/api/bookings/${nonExistentBookingId}`)
        .set('Authorization', validToken);

      expect(res.statusCode).toEqual(403);
    });
  });
});