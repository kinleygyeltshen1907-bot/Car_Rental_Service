import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import carRoutes from './routes/cars.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import feedbackRoutes from './routes/feedback.js';

dotenv.config();
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Configure backend/.env before starting.');
  process.exit(1);
}
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));
app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use((req,res) => res.status(404).json({ message: 'API route not found.' }));
app.use((err,req,res,next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error. Check the backend terminal for details.' });
});
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`CRS API running at http://localhost:${port}`));
