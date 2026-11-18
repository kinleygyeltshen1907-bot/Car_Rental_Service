import { Router } from 'express';
import pool from '../db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/overview', async (req, res, next) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role='customer'");
    const [[vehicles]] = await pool.query("SELECT COUNT(*) AS total, SUM(status='available') AS available FROM vehicles WHERE status<>'inactive'");
    const [[bookings]] = await pool.query("SELECT COUNT(*) AS total, SUM(status='pending') AS pending FROM bookings");
    const [[revenue]] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid'");
    const [recent] = await pool.query(
      `SELECT b.id,b.pickup_date,b.return_date,b.total_amount,b.status,u.full_name AS customer_name,v.name AS vehicle_name
       FROM bookings b JOIN users u ON u.id=b.user_id JOIN vehicles v ON v.id=b.vehicle_id
       ORDER BY b.created_at DESC LIMIT 6`
    );
    res.json({ customers: users.total, vehicles: vehicles.total, available: vehicles.available || 0,
      bookings: bookings.total, pending: bookings.pending || 0, revenue: revenue.total, recent });
  } catch (err) { next(err); }
});

router.get('/customers', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id,u.full_name,u.email,u.phone,u.created_at,COUNT(b.id) AS bookings
       FROM users u LEFT JOIN bookings b ON b.user_id=u.id
       WHERE u.role='customer' GROUP BY u.id ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/payments', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,b.id AS booking_id,u.full_name AS customer_name
       FROM payments p JOIN bookings b ON b.id=p.booking_id JOIN users u ON u.id=b.user_id
       ORDER BY p.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/payments/:id/paid', async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      "UPDATE payments SET status='paid',payment_date=NOW() WHERE id=? AND status='pending'", [req.params.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: 'Payment not found or already processed.' });
    res.json({ message: 'Payment marked as paid.' });
  } catch (err) { next(err); }
});

router.get('/reports', async (req, res, next) => {
  try {
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(payment_date,'%Y-%m') AS month, SUM(amount) AS revenue
       FROM payments WHERE status='paid' AND payment_date IS NOT NULL
       GROUP BY DATE_FORMAT(payment_date,'%Y-%m') ORDER BY month DESC LIMIT 12`
    );
    const [popular] = await pool.query(
      `SELECT v.name,COUNT(b.id) AS rentals FROM vehicles v
       LEFT JOIN bookings b ON b.vehicle_id=v.id AND b.status<>'cancelled'
       GROUP BY v.id ORDER BY rentals DESC LIMIT 5`
    );
    res.json({ monthly, popular });
  } catch (err) { next(err); }
});

export default router;
