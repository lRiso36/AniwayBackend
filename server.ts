import 'dotenv/config'; //loads .env keys first
import express from 'express';
import authRoutes from './routes/authRoutes';
import animeRoutes from './routes/animeRoutes';
import {requireAuth} from './middleware/authMiddleware';
import userAnimeRoutes from './routes/userAnimeRoutes'
import cors from 'cors';
import animeGroupRoutes from "./routes/animeGroupRoutes";
import userListRoutes from './routes/userListRoutes';

const app = express ();

app.use(express.json()); // lets app read JSON from request 
app.use(cors({
    origin: 'http://localhost:5173'
})) //allow my frontend to requets my backend

app.use('/api/auth', authRoutes); // register them under /api/auth
app.use('/api/anime', requireAuth, animeRoutes)
app.use('/api/user', requireAuth, userAnimeRoutes)
app.use('/api/browse', requireAuth, animeGroupRoutes);
app.use('/api/lists', requireAuth, userListRoutes)
const PORT = process.env.PORT || 3000; //checks if .env has PORT, else 3000
app.listen(PORT, () => 
    console.log(`Server running on port ${PORT}`)); //keeps it running


