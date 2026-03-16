import express from 'express';
import Role from '../models/Role.js';
import { verifyJWT } from '../utils/jwt.js';

const router = express.Router();

// Middleware to verify admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all roles
router.get('/', verifyJWT, async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get role by ID
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create role (admin only)
router.post('/', verifyJWT, isAdmin, async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update role (admin only)
router.put('/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json(role);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete role (admin only)
router.delete('/:id', verifyJWT, isAdmin, async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ error: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
