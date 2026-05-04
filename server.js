import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.json());

app.get((req, res) => {
   res.send("Event booking api is running")
 });

 app.listen(PORT, () => {
   console.log(`app is running is on ${PORT}`)
 });