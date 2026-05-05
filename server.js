import express from 'express';
import { testConnection } from './src/schema/db.js';
import { authenticateToken } from './src/middleware/auth.middleware.js';
import authroute from './src/routes/auth.route.js'
import eventroute from './src/routes/event.route.js'
import bookingroute from './src/routes/booking.route.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());

app.use('/api', globalLimiter);
app.use('/api', authroute);

app.use('/api', eventroute)
app.use('/api', bookingroute)


app.get('/', (req, res) => {
   res.send("Event booking api is running")
 });

 app.post('/api/bookings', authenticateToken, async (req, res) => {
  res.json({ message: `Booking created for user ${req.user.id}` });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

 testConnection();



 app.listen(PORT, () => {
   console.log(`app is running is on ${PORT}`)
 });