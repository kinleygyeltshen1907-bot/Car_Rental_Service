import { Router } from 'express';
import pool from '../db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { search = '', category = '' } = req.query;
    const like = `%${search}%`;
    const [rows] = await pool.execute(
      `SELECT v.*,
       (SELECT ROUND(AVG(rating),1) FROM feedback f WHERE f.vehicle_id=v.id) AS rating
       FROM vehicles v
       WHERE v.status='available'
       AND (v.name LIKE ? OR v.brand LIKE ? OR v.model LIKE ?)
       AND (?='' OR v.category=?) ORDER BY v.created_at DESC`,
      [like, like, like, category, category]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/admin/all', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { name, brand, model, category, registration_no, year, seats, fuel_type, transmission, price_per_day, image_url, description } = req.body;
    if (!name || !brand || !model || !category || !registration_no || !(Number(price_per_day) > 0))
      return res.status(400).json({ message: 'Complete all required vehicle fields. Price must be greater than zero.' });
    const [result] = await pool.execute(
      `INSERT INTO vehicles (name,brand,model,category,registration_no,year,seats,fuel_type,transmission,price_per_day,image_url,description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name,brand,model,category,registration_no,year || null,seats || 5,fuel_type || 'Petrol',transmission || 'Automatic',price_per_day,image_url || null,description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Vehicle added successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Registration number already exists.' });
    next(err);
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const fields = ['name','brand','model','category','registration_no','year','seats','fuel_type','transmission','price_per_day','image_url','description','status'];
    const values = fields.filter(k => req.body[k] !== undefined);
    if (!values.length) return res.status(400).json({ message: 'No changes provided.' });
    const sql = values.map(k => `${k}=?`).join(',');
    const [result] = await pool.execute(`UPDATE vehicles SET ${sql} WHERE id=?`, [...values.map(k => req.body[k]), req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Vehicle not found.' });
    res.json({ message: 'Vehicle updated.' });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const [result] = await pool.execute("UPDATE vehicles SET status='inactive' WHERE id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Vehicle not found.' });
    res.json({ message: 'Vehicle retired. Historical records are preserved.' });
  } catch (err) { next(err); }
});

export default router;
