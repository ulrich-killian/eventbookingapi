import request from 'supertest';
import app, { server } from '../server.js';
import { pool } from '../src/schema/db.js';

describe('Auth Endpoints - /api/register and /api/login', () => {

  afterAll(async () => {
    await pool.end();
    server.close();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users');
    await pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  });

  afterEach(async () => {
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM events');
    await pool.query('DELETE FROM users');
  });


  describe('POST /api/register', () => {
    it('should return 201 with a token on valid registration', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should return 409 if email already exists', async () => {
      await request(app)
        .post('/api/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/register')
        .send({ username: 'testuser2', email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(409);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toEqual(400);
    });
  });


  describe('POST /api/login', () => {
    // ✅ seed a real user through HTTP — not raw DB insert
    beforeEach(async () => {
      await request(app)
        .post('/api/register')
        .send({ username: 'testuser', email: 'test@example.com', password: 'password123' });
    });

    it('should return 200 with a token on correct credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token'); // ← the exact check that catches the JWT bug
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 on unknown email', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'ghost@example.com', password: 'password123' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com' }); // missing password

      expect(res.statusCode).toEqual(400);
    });
  });

});