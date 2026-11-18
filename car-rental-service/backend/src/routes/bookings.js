import { Router } from 'express';
import pool from '../db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { vehicle_id, pickup_date, return_date, pickup_location, dropoff_location, payment_method = 'cash' } = req.body;
    if (!vehicle_id || !pickup_date || !return_date || !pickup_location?.trim() || !dropoff_location?.trim())
      return res.status(400).json({ message: 'Please complete all booking details.' });
    const start = new Date(`${pickup_date}T00:00:00`);
    const end = new Date(`${return_date}T00:00:00`);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.ceil((end - start) / 86400000);
    if (Number.isNaN(days) || days < 1 || start < today)
      return res.status(400).json({ message: 'Choose a valid pickup date and a return date after pickup.' });

    await conn.beginTransaction();
    const [cars] = await conn.execute("SELECT id,price_per_day,status FROM vehicles WHERE id=? FOR UPDATE", [vehicle_id]);
    if (!cars[0] || cars[0].status !== 'available') {
      await conn.rollback(); return res.status(404).json({ message: 'This vehicle is not available.' });
    }
    const [conflicts] = await conn.execute(
      `SELECT id FROM bookings WHERE vehicle_id=? AND status IN ('pending','confirmed')
       AND pickup_date < ? AND return_date > ?`,
      [vehicle_id, return_date, pickup_date]
    );
    if (conflicts.length) {
      await conn.rollback(); return res.status(409).json({ message: 'This vehicle is already booked for some of those dates.' });
    }
    const total = Number(cars[0].price_per_day) * days;
    const [booking] = await conn.execute(
      `INSERT INTO bookings (user_id,vehicle_id,pickup_date,return_date,pickup_location,dropoff_location,days,total_amount)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id,vehicle_id,pickup_date,return_date,pickup_location.trim(),dropoff_location.trim(),days,total]
    );
    await conn.execute(
      'INSERT INTO payments (booking_id,amount,method,status) VALUES (?,?,?,?)',
      [booking.insertId,total,['cash','bank_transfer','online'].includes(payment_method) ? payment_method : 'cash','pending']
    );
    await conn.commit();
    res.status(201).json({ id: booking.insertId, total_amount: total, message: 'Booking submitted. Await administrator confirmation.' });
  } catch (err) {
    await conn.rollback(); next(err);
  } finally { conn.release(); }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.*,v.name AS vehicle_name,v.image_url,p.status AS payment_status,p.method AS payment_method
       FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id
       LEFT JOIN payments p ON p.booking_id=b.id
       WHERE b.user_id=? ORDER BY b.created_at DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      `UPDATE bookings SET status='cancelled' WHERE id=? AND user_id=? AND status='pending'`,
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(400).json({ message: 'Only your pending bookings can be cancelled online.' });
    res.json({ message: 'Booking cancelled.' });
  } catch (err) { next(err); }
});

router.get('/admin/all', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*,u.full_name AS customer_name,u.email,v.name AS vehicle_name,
       p.status AS payment_status,p.method AS payment_method,p.id AS payment_id
       FROM bookings b JOIN users u ON u.id=b.user_id JOIN vehicles v ON v.id=b.vehicle_id
       LEFT JOIN payments p ON p.booking_id=b.id ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.patch('/admin/:id/status', authenticate, adminOnly, async (req, res, next) => {
  try {
    const allowed = ['pending','confirmed','cancelled','completed'];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: 'Invalid booking status.' });
    const [result] = await pool.execute('UPDATE bookings SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Booking not found.' });
    res.json({ message: 'Booking status updated.' });
  } catch (err) { next(err); }
});

export default router;
