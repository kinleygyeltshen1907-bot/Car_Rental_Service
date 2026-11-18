import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name?.trim() || !email?.trim() || !phone?.trim() || !password)
      return res.status(400).json({ message: 'Please complete all fields.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (full_name,email,phone,password_hash) VALUES (?,?,?,?)',
      [full_name.trim(), email.trim().toLowerCase(), phone.trim(), hash]
    );
    res.status(201).json({ message: 'Account created. You can now log in.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That email is already registered.' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.execute(
      'SELECT id,full_name,email,phone,password_hash,role FROM users WHERE email=?',
      [(email || '').trim().toLowerCase()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash)))
      return res.status(401).json({ message: 'Invalid email or password.' });
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET, { expiresIn: '8h' }
    );
    res.json({ token, user: { id: user.id, name: user.full_name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) { next(err); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id,full_name AS name,email,phone,role FROM users WHERE id=?', [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Account not found.' });
    res.json({ user: rows[0] });
  } catch (err) { next(err); }
});

export default router;
