import express from 'express';
import { testConnection } from './src/schema/db.js';

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());

app.get('/', (req, res) => {
   res.send("Event booking api is running")
 });

 testConnection();

 app.listen(PORT, () => {
   console.log(`app is running is on ${PORT}`)
 });