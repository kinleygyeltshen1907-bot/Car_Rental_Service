import { Router } from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// A customer can review a vehicle only after their booking is completed.
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { booking_id, rating, comment = '' } = req.body;
    const score = Number(rating);
    if (!booking_id || !Number.isInteger(score) || score < 1 || score > 5)
      return res.status(400).json({ message: 'Choose a booking and a rating from 1 to 5.' });
    const [rows] = await pool.execute(
      `SELECT id, vehicle_id FROM bookings WHERE id=? AND user_id=? AND status='completed'`,
      [booking_id, req.user.id]
    );
    if (!rows[0]) return res.status(403).json({ message: 'You can review a vehicle after your booking is completed.' });
    await pool.execute(
      'INSERT INTO feedback (user_id,vehicle_id,booking_id,rating,comment) VALUES (?,?,?,?,?)',
      [req.user.id, rows[0].vehicle_id, booking_id, score, String(comment).trim()]
    );
    res.status(201).json({ message: 'Thank you for your feedback.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'You have already reviewed this booking.' });
    next(err);
  }
});

export default router;
