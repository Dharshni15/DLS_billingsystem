import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { signToken, requireAuth } from '../utils/jwt.js'
import bcrypt from 'bcryptjs'

const router = Router()

// Signup (customer only)
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' })
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ error: 'Email already in use' })
    const u = await User.create({ name, email, password, role: 'customer' })
    const token = signToken(u)
    res.status(201).json({ token, user: { _id: u._id, name: u.name, email: u.email, role: u.role } })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    console.log(`Login attempt for email: ${email}`);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const u = await User.findOne({ email });
    if (!u) {
      console.log(`User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await u.comparePassword(password || '');
    if (!ok) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(u);
    console.log(`Login successful for user: ${email}`);
    res.json({ token, user: { _id: u._id, name: u.name, email: u.email, role: u.role } });
  } catch (e) {
    console.error(`Login error: ${e.message}`);
    res.status(400).json({ error: `Server error: ${e.message}` });
  }
});

// Me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user })
})

export default router
