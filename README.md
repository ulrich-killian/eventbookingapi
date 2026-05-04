### Event Booking App API Documentation

this project consist of a Backend event planning and booking. Built using node js javascript, express, postgres db. i.e with three seperate services

   1) Core service: This service is responsible for performing the core operations of the app. It is built using express, postgres
   2) bcryptjs: for password hashing and jsonwebtoken for JWT generation/validation.
    Authentication service: As of now, authentication is handled by the core service. However, I am working on decoupling the authentication endpoints from the core service and making the auth service a standalone service.
   3) Tokens expire (set with expiry in JWT.sign); input validation (e.g., email format, password strength); SQL injection prevention; error responses (e.g., 409 for insufficient seats, 403 for unauthorized access).
   4) Performance and Edge Cases: Handles concurrent bookings without data loss; invalid/expired tokens rejected; future-date enforcement; no unauthorized access to user-specific data.
   5) Protect routes with middleware: Apply to create/update events, all booking operations; public for reads and auth.
   6) Add pagination for listing endpoints (e.g., ?limit=10&offset=0).
   7) Handle date validation and timezone considerations with Node's Date object.

   ### Requirements

    Nodejs is a JavaScript runtime built on Chrome's V8 JavaScript engine.
    PostgreSQL is a powerful relational db, open source object-relational database system with over 35 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.
    Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.

   ### Features

    Authentication Service:
        User registration: Registers a new user
        User login: Logs in a registered user
        Password change: Change password while logged in
        Forgot password: Change password when user forgets
        Email verification: Verify user via email

   ### Core Service:
        Event: Create, Update, Read and Cancel events
        Bookings: Create, Update, Read, Cancel bookings

   ### Getting Started

   ### Core API Endpoints:

### POST /register: Create a new user (body: {username, email, password}; validate uniqueness, hash password, return 201 with JWT token).
### POST /login: Authenticate user (body: {email, password}; verify hash, return 200 with JWT token if valid, else 401).
### GET /events: List events with date filtering (start/end query params using SQL BETWEEN).
### GET /events/:id: Fetch event with booking summary (aggregate seats_booked for the event).
### POST /events: Create event (protected; body: {title, description, date, total_seats}; validate future date using Node's Date object; set created_by to current user ID).
### PUT /events/:id: Update event (protected; prevent reducing seats below booked; only allow owner to update).

Bookings (Protected):

### POST /events/:id/book: Book seats (protected; body: {seats}; extract user_id from JWT, check availability, update available_seats atomically with transaction).
### GET /bookings: List user's bookings (protected; filter by user_id from JWT).
### DELETE /bookings/:id: Cancel booking (protected; only for the user's own booking; restore seats).
![Database Schema](./docs/db.png)